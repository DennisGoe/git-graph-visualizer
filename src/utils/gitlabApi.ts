import { nanoid } from 'nanoid';
import type { GitCommit, GitBranch, GitTag, GitState } from '../types/git';
import { BRANCH_COLORS } from '../types/git';

// ---------- GitLab API response types ----------

interface GLProject {
  default_branch: string;
}

interface GLBranch {
  name: string;
  commit: { id: string };
}

interface GLCommit {
  id: string; // full SHA
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  authored_date: string;
  parent_ids: string[];
}

interface GLTag {
  name: string;
  commit: { id: string };
}

// ---------- Helpers ----------

const PER_PAGE = 100;
const MAX_PAGES = 5;

function authHeaders(token: string): Record<string, string> {
  return {
    'PRIVATE-TOKEN': token,
    Accept: 'application/json',
  };
}

/**
 * GitLab uses `x-next-page` header or Link header for pagination.
 * We simply increment page numbers.
 */
async function fetchAllPages<T>(
  baseUrl: string,
  headers: Record<string, string>,
): Promise<T[]> {
  const results: T[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const sep = baseUrl.includes('?') ? '&' : '?';
    const url = `${baseUrl}${sep}per_page=${PER_PAGE}&page=${page}`;

    const res = await fetch(url, { headers });

    if (res.status === 401) {
      throw new Error(
        'Unauthorized. Check your GitLab Personal Access Token.',
      );
    }

    if (res.status === 404) {
      throw new Error(
        'Project not found. Check the project path and ensure the token has access.',
      );
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitLab API ${res.status}: ${body.slice(0, 200)}`);
    }

    const data: T[] = await res.json();
    results.push(...data);

    // If we got fewer than PER_PAGE results, there are no more pages
    if (data.length < PER_PAGE) break;
  }

  return results;
}

// ---------- Topological sort (Kahn's algorithm) ----------

function topoSort(commitsBySha: Map<string, GLCommit>): string[] {
  const shaSet = new Set(commitsBySha.keys());
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const sha of shaSet) {
    if (!inDegree.has(sha)) inDegree.set(sha, 0);
    const parents = commitsBySha.get(sha)!.parent_ids;
    for (const p of parents) {
      if (!shaSet.has(p)) continue;
      inDegree.set(sha, (inDegree.get(sha) ?? 0) + 1);
      if (!children.has(p)) children.set(p, []);
      children.get(p)!.push(sha);
    }
  }

  const queue: string[] = [];
  for (const [sha, deg] of inDegree) {
    if (deg === 0) queue.push(sha);
  }

  queue.sort((a, b) => {
    const da = new Date(commitsBySha.get(a)!.authored_date).getTime();
    const db = new Date(commitsBySha.get(b)!.authored_date).getTime();
    return da - db;
  });

  const result: string[] = [];
  while (queue.length > 0) {
    const sha = queue.shift()!;
    result.push(sha);
    for (const child of children.get(sha) ?? []) {
      const d = (inDegree.get(child) ?? 1) - 1;
      inDegree.set(child, d);
      if (d === 0) queue.push(child);
    }
  }

  for (const sha of shaSet) {
    if (!result.includes(sha)) result.push(sha);
  }

  return result;
}

// ---------- Main entry point ----------

export type FetchRepoResult = { data: GitState } | { error: string };

/**
 * Fetch a GitLab project.
 * @param instanceUrl  e.g. "https://gitlab.com" or "https://gitlab.mycompany.com"
 * @param projectPath  e.g. "my-group/my-project" (URL-encoded internally)
 * @param token        GitLab Personal Access Token (with `read_repository` or `read_api` scope)
 */
export async function fetchGitLabRepo(
  instanceUrl: string,
  projectPath: string,
  token: string,
  onProgress?: (msg: string) => void,
): Promise<FetchRepoResult> {
  try {
    const base = instanceUrl.replace(/\/+$/, '');
    const encodedPath = encodeURIComponent(projectPath);
    const apiBase = `${base}/api/v4`;
    const headers = authHeaders(token);
    const progress = (msg: string) => onProgress?.(msg);

    // 1. Fetch project metadata
    progress('Fetching project info...');
    const projectRes = await fetch(`${apiBase}/projects/${encodedPath}`, { headers });

    if (projectRes.status === 404) {
      return { error: 'Project not found. Check the project path and ensure the token has access.' };
    }
    if (projectRes.status === 401) {
      return { error: 'Unauthorized. Check your GitLab Personal Access Token.' };
    }
    if (!projectRes.ok) {
      return { error: `GitLab API error: ${projectRes.status}` };
    }

    const projectData: GLProject = await projectRes.json();
    const defaultBranch = projectData.default_branch;

    // 2. Fetch all branches
    progress('Fetching branches...');
    const glBranches = await fetchAllPages<GLBranch>(
      `${apiBase}/projects/${encodedPath}/repository/branches`,
      headers,
    );
    progress(`Found ${glBranches.length} branches`);

    // 3. Fetch tags
    progress('Fetching tags...');
    const glTags = await fetchAllPages<GLTag>(
      `${apiBase}/projects/${encodedPath}/repository/tags`,
      headers,
    );
    progress(`Found ${glTags.length} tags`);

    // 4. Fetch commits for each branch (dedup by SHA)
    const commitsBySha = new Map<string, GLCommit>();

    for (let i = 0; i < glBranches.length; i++) {
      const branch = glBranches[i];
      progress(`Fetching commits for branch "${branch.name}" (${i + 1}/${glBranches.length})...`);

      const branchCommits = await fetchAllPages<GLCommit>(
        `${apiBase}/projects/${encodedPath}/repository/commits?ref_name=${encodeURIComponent(branch.name)}`,
        headers,
      );

      for (const c of branchCommits) {
        if (!commitsBySha.has(c.id)) {
          commitsBySha.set(c.id, c);
        }
      }
    }

    progress(`Fetched ${commitsBySha.size} unique commits`);

    // 5. Build internal ID mappings
    progress('Building graph...');
    const shaToId = new Map<string, string>();
    for (const sha of commitsBySha.keys()) {
      shaToId.set(sha, nanoid());
    }

    // 6. Topological sort
    const sortedShas = topoSort(commitsBySha);

    // 7. Branch assignment
    const branchNames = glBranches.map((b) => b.name).sort((a, b) => {
      if (a === defaultBranch) return -1;
      if (b === defaultBranch) return 1;
      if (a === 'main' || a === 'master') return -1;
      if (b === 'main' || b === 'master') return 1;
      return a.localeCompare(b);
    });

    const commitBranchMap = new Map<string, string>();

    for (const branchName of branchNames) {
      const branchInfo = glBranches.find((b) => b.name === branchName);
      if (!branchInfo) continue;

      let sha: string | undefined = branchInfo.commit.id;
      const visited = new Set<string>();

      while (sha && !visited.has(sha)) {
        visited.add(sha);
        if (!commitBranchMap.has(sha)) {
          commitBranchMap.set(sha, branchName);
        }
        const commit = commitsBySha.get(sha);
        sha = commit?.parent_ids[0];
      }
    }

    // 8. Build GitState
    const commits: Record<string, GitCommit> = {};
    const commitOrder: string[] = [];

    for (const sha of sortedShas) {
      const glCommit = commitsBySha.get(sha)!;
      const id = shaToId.get(sha)!;

      const parentIds = glCommit.parent_ids
        .map((p) => shaToId.get(p))
        .filter((pid): pid is string => pid !== undefined);

      const branch = commitBranchMap.get(sha) ?? defaultBranch;

      commits[id] = {
        id,
        hash: sha.slice(0, 7),
        message: glCommit.title,
        timestamp: new Date(glCommit.authored_date).getTime(),
        author: glCommit.author_name,
        date: glCommit.authored_date,
        branch,
        parentIds,
      };

      commitOrder.push(id);
    }

    // Branches
    const branches: Record<string, GitBranch> = {};
    let colorIdx = 0;
    for (const branchName of branchNames) {
      const branchInfo = glBranches.find((b) => b.name === branchName);
      if (!branchInfo) continue;
      const headId = shaToId.get(branchInfo.commit.id);
      if (!headId) continue;

      branches[branchName] = {
        name: branchName,
        color: BRANCH_COLORS[colorIdx % BRANCH_COLORS.length],
        headCommitId: headId,
      };
      colorIdx++;
    }

    // Tags
    const tags: Record<string, GitTag> = {};
    for (const glTag of glTags) {
      const commitId = shaToId.get(glTag.commit.id);
      if (commitId) {
        tags[glTag.name] = { name: glTag.name, commitId };
      }
    }

    // Head
    const defaultBranchInfo = glBranches.find((b) => b.name === defaultBranch);
    const head = defaultBranchInfo
      ? shaToId.get(defaultBranchInfo.commit.id) ?? commitOrder[commitOrder.length - 1]
      : commitOrder[commitOrder.length - 1];

    progress('Done!');

    return {
      data: {
        commits,
        branches,
        tags,
        head,
        currentBranch: defaultBranch,
        commitOrder,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    return { error: message };
  }
}

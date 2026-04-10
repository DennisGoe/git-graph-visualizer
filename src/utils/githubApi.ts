import { nanoid } from 'nanoid';
import type { GitCommit, GitBranch, GitTag, GitState } from '../types/git';
import { BRANCH_COLORS } from '../types/git';

// ---------- GitHub API response types ----------

interface GHRepo {
  default_branch: string;
}

interface GHBranch {
  name: string;
  commit: { sha: string };
}

interface GHCommitAuthor {
  name: string;
  date: string;
}

interface GHCommit {
  sha: string;
  commit: {
    message: string;
    author: GHCommitAuthor;
  };
  parents: { sha: string }[];
}

interface GHTag {
  name: string;
  commit: { sha: string };
}

// ---------- Helpers ----------

const API_BASE = 'https://api.github.com';
const PER_PAGE = 100;
const MAX_PAGES = 5;

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };
}

/** Extract the URL for rel="next" from a GitHub Link header. */
function getNextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

/** Paginated fetch — follows Link headers up to MAX_PAGES. */
async function fetchAllPages<T>(
  url: string,
  headers: Record<string, string>,
): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = url;
  let page = 0;

  while (nextUrl && page < MAX_PAGES) {
    const res = await fetch(nextUrl, { headers });

    if (res.status === 403) {
      const body = await res.json().catch(() => ({}));
      const msg =
        (body as Record<string, string>).message ?? 'Forbidden (403)';
      if (msg.toLowerCase().includes('rate limit')) {
        throw new Error(
          'GitHub API rate limit exceeded. Wait a minute or use a Personal Access Token.',
        );
      }
      throw new Error(`GitHub API error: ${msg}`);
    }

    if (res.status === 404) {
      throw new Error(
        'Repository not found. Check the owner/repo and ensure the token has access.',
      );
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
    }

    const data: T[] = await res.json();
    results.push(...data);

    nextUrl = getNextPageUrl(res.headers.get('link'));
    page++;
  }

  return results;
}

// ---------- Topological sort (Kahn's algorithm) ----------

function topoSort(
  commitsBySha: Map<string, GHCommit>,
): string[] {
  // Build in-degree map (only for commits we actually have)
  const shaSet = new Set(commitsBySha.keys());
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>(); // parent -> children

  for (const sha of shaSet) {
    if (!inDegree.has(sha)) inDegree.set(sha, 0);
    const parents = commitsBySha.get(sha)!.parents;
    for (const p of parents) {
      if (!shaSet.has(p.sha)) continue;
      inDegree.set(sha, (inDegree.get(sha) ?? 0) + 1);
      if (!children.has(p.sha)) children.set(p.sha, []);
      children.get(p.sha)!.push(sha);
    }
  }

  // Seed the queue with nodes that have no in-repo parents
  const queue: string[] = [];
  for (const [sha, deg] of inDegree) {
    if (deg === 0) queue.push(sha);
  }

  // Sort roots by date (oldest first) for deterministic output
  queue.sort((a, b) => {
    const da = new Date(commitsBySha.get(a)!.commit.author.date).getTime();
    const db = new Date(commitsBySha.get(b)!.commit.author.date).getTime();
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

  // If there are shas not yet in result (cycles / disconnected), append them
  for (const sha of shaSet) {
    if (!result.includes(sha)) result.push(sha);
  }

  return result; // oldest first
}

// ---------- Main entry point ----------

export type FetchRepoResult =
  | { data: GitState }
  | { error: string };

export async function fetchGitHubRepo(
  owner: string,
  repo: string,
  token: string,
  onProgress?: (msg: string) => void,
): Promise<FetchRepoResult> {
  try {
    const headers = authHeaders(token);
    const progress = (msg: string) => onProgress?.(msg);

    // 1. Fetch repo metadata (default branch)
    progress('Fetching repository info...');
    const repoRes = await fetch(`${API_BASE}/repos/${owner}/${repo}`, {
      headers,
    });

    if (repoRes.status === 404) {
      return {
        error:
          'Repository not found. Check the owner/repo and ensure the token has access.',
      };
    }
    if (repoRes.status === 403) {
      const body = await repoRes.json().catch(() => ({}));
      const msg =
        (body as Record<string, string>).message ?? 'Forbidden (403)';
      if (msg.toLowerCase().includes('rate limit')) {
        return {
          error:
            'GitHub API rate limit exceeded. Wait a minute or provide a Personal Access Token.',
        };
      }
      return { error: `GitHub API error: ${msg}` };
    }
    if (!repoRes.ok) {
      return { error: `GitHub API error: ${repoRes.status}` };
    }

    const repoData: GHRepo = await repoRes.json();
    const defaultBranch = repoData.default_branch;

    // 2. Fetch all branches
    progress('Fetching branches...');
    const ghBranches = await fetchAllPages<GHBranch>(
      `${API_BASE}/repos/${owner}/${repo}/branches?per_page=${PER_PAGE}`,
      headers,
    );
    progress(`Found ${ghBranches.length} branches`);

    // 3. Fetch tags
    progress('Fetching tags...');
    const ghTags = await fetchAllPages<GHTag>(
      `${API_BASE}/repos/${owner}/${repo}/tags?per_page=${PER_PAGE}`,
      headers,
    );
    progress(`Found ${ghTags.length} tags`);

    // 4. Fetch commits for each branch (deduplicating by SHA)
    const commitsBySha = new Map<string, GHCommit>();

    for (let i = 0; i < ghBranches.length; i++) {
      const branch = ghBranches[i];
      progress(
        `Fetching commits for branch "${branch.name}" (${i + 1}/${ghBranches.length})...`,
      );
      const branchCommits = await fetchAllPages<GHCommit>(
        `${API_BASE}/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch.name)}&per_page=${PER_PAGE}`,
        headers,
      );

      for (const c of branchCommits) {
        if (!commitsBySha.has(c.sha)) {
          commitsBySha.set(c.sha, c);
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

    // 6. Topological sort (oldest first)
    const sortedShas = topoSort(commitsBySha);

    // 7. Branch assignment — walk from each branch head following first-parent
    //    Priority: default branch first, then others sorted alphabetically
    const branchNames = ghBranches.map((b) => b.name).sort((a, b) => {
      if (a === defaultBranch) return -1;
      if (b === defaultBranch) return 1;
      // main/master secondary priority
      if (a === 'main' || a === 'master') return -1;
      if (b === 'main' || b === 'master') return 1;
      return a.localeCompare(b);
    });

    const commitBranchMap = new Map<string, string>();

    for (const branchName of branchNames) {
      const branchInfo = ghBranches.find((b) => b.name === branchName);
      if (!branchInfo) continue;

      let sha: string | undefined = branchInfo.commit.sha;
      const visited = new Set<string>();

      while (sha && !visited.has(sha)) {
        visited.add(sha);
        if (!commitBranchMap.has(sha)) {
          commitBranchMap.set(sha, branchName);
        }
        const commit = commitsBySha.get(sha);
        sha = commit?.parents[0]?.sha; // first-parent only
      }
    }

    // 8. Build GitState
    const commits: Record<string, GitCommit> = {};
    const commitOrder: string[] = [];

    for (const sha of sortedShas) {
      const ghCommit = commitsBySha.get(sha)!;
      const id = shaToId.get(sha)!;

      const parentIds = ghCommit.parents
        .map((p) => shaToId.get(p.sha))
        .filter((pid): pid is string => pid !== undefined);

      const branch = commitBranchMap.get(sha) ?? defaultBranch;
      const ts = new Date(ghCommit.commit.author.date).getTime();

      commits[id] = {
        id,
        hash: sha.slice(0, 7),
        message: ghCommit.commit.message.split('\n')[0], // first line only
        timestamp: ts,
        author: ghCommit.commit.author.name,
        date: ghCommit.commit.author.date,
        branch,
        parentIds,
      };

      commitOrder.push(id);
    }

    // Branches
    const branches: Record<string, GitBranch> = {};
    let colorIdx = 0;
    for (const branchName of branchNames) {
      const branchInfo = ghBranches.find((b) => b.name === branchName);
      if (!branchInfo) continue;

      const headId = shaToId.get(branchInfo.commit.sha);
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
    for (const ghTag of ghTags) {
      const commitId = shaToId.get(ghTag.commit.sha);
      if (commitId) {
        tags[ghTag.name] = {
          name: ghTag.name,
          commitId,
        };
      }
    }

    // Head — default branch's head commit
    const defaultBranchInfo = ghBranches.find(
      (b) => b.name === defaultBranch,
    );
    const head = defaultBranchInfo
      ? shaToId.get(defaultBranchInfo.commit.sha) ?? commitOrder[commitOrder.length - 1]
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
    const message =
      err instanceof Error ? err.message : 'An unknown error occurred.';
    return { error: message };
  }
}

import { nanoid } from 'nanoid';
import type { GitCommit, GitBranch, GitTag } from '../types/git';
import { BRANCH_COLORS } from '../types/git';

/**
 * Expected input format (v2 — with author + date):
 *   git log --all --format="%H|%P|%D|%an|%aI|%s" --topo-order
 *
 * Each line: hash|parents|refs|author|iso-date|subject
 *
 * Also accepts the old v1 format (4 fields) for backwards compat:
 *   git log --all --format="%H|%P|%D|%s" --topo-order
 */

interface ParsedRepo {
  commits: Record<string, GitCommit>;
  branches: Record<string, GitBranch>;
  tags: Record<string, GitTag>;
  head: string;
  currentBranch: string;
  commitOrder: string[];
}

interface RawEntry {
  hash: string;
  parentHashes: string[];
  refs: string;
  author: string;
  date: string;
  message: string;
  id: string;
}

function splitLine(line: string): RawEntry | null {
  // Count pipes to detect v1 (3 pipes → 4 fields) vs v2 (5 pipes → 6 fields)
  const pipes: number[] = [];
  for (let i = 0; i < line.length && pipes.length < 6; i++) {
    if (line[i] === '|') pipes.push(i);
  }

  if (pipes.length >= 5) {
    // v2: hash|parents|refs|author|date|message
    return {
      hash: line.slice(0, pipes[0]).trim(),
      parentHashes: line.slice(pipes[0] + 1, pipes[1]).trim()
        ? line.slice(pipes[0] + 1, pipes[1]).trim().split(/\s+/)
        : [],
      refs: line.slice(pipes[1] + 1, pipes[2]).trim(),
      author: line.slice(pipes[2] + 1, pipes[3]).trim(),
      date: line.slice(pipes[3] + 1, pipes[4]).trim(),
      message: line.slice(pipes[4] + 1).trim(),
      id: nanoid(),
    };
  }

  if (pipes.length >= 3) {
    // v1: hash|parents|refs|message
    return {
      hash: line.slice(0, pipes[0]).trim(),
      parentHashes: line.slice(pipes[0] + 1, pipes[1]).trim()
        ? line.slice(pipes[0] + 1, pipes[1]).trim().split(/\s+/)
        : [],
      refs: line.slice(pipes[1] + 1, pipes[2]).trim(),
      author: '',
      date: '',
      message: line.slice(pipes[2] + 1).trim(),
      id: nanoid(),
    };
  }

  return null;
}

export function parseGitLog(raw: string): ParsedRepo | { error: string } {
  const lines = raw
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { error: 'No input provided. Paste the output of the git log command.' };
  }

  if (!lines[0].includes('|')) {
    return {
      error:
        'Invalid format. Please run this exact command in your repo:\n\n' +
        GIT_LOG_COMMAND,
    };
  }

  const commits: Record<string, GitCommit> = {};
  const branches: Record<string, GitBranch> = {};
  const tags: Record<string, GitTag> = {};
  const hashToId: Record<string, string> = {};
  const commitOrder: string[] = [];
  let head = '';
  let currentBranch = 'main';

  const commitBranchMap: Record<string, string> = {};

  // --- First pass: parse every line -----------------------------------------
  const parsed: RawEntry[] = [];

  for (const line of lines) {
    const entry = splitLine(line);
    if (!entry) continue;

    hashToId[entry.hash] = entry.id;
    if (entry.hash.length >= 7) {
      hashToId[entry.hash.slice(0, 7)] = entry.id;
    }
    parsed.push(entry);
  }

  if (parsed.length === 0) {
    return { error: 'Could not parse any commits from the input.' };
  }

  // --- Second pass: resolve refs → branches, tags, HEAD --------------------
  const refBranchHeads: Record<string, string> = {};

  for (const entry of parsed) {
    if (!entry.refs) continue;

    const refParts = entry.refs.split(',').map((r) => r.trim());

    for (const ref of refParts) {
      const headMatch = ref.match(/^HEAD\s*->\s*(.+)$/);
      if (headMatch) {
        const name = headMatch[1].replace(/^origin\//, '');
        currentBranch = name;
        head = entry.id;
        refBranchHeads[name] = entry.hash;
        continue;
      }

      const tagMatch = ref.match(/^tag:\s*(.+)$/);
      if (tagMatch) {
        tags[tagMatch[1]] = { name: tagMatch[1], commitId: entry.id };
        continue;
      }

      if (ref.startsWith('origin/')) {
        const local = ref.slice(7);
        if (!refBranchHeads[local]) {
          refBranchHeads[local] = entry.hash;
        }
        continue;
      }

      if (ref !== 'HEAD') {
        refBranchHeads[ref] = entry.hash;
      }
    }
  }

  if (!head && parsed.length > 0) {
    head = parsed[0].id;
  }

  if (!refBranchHeads['main'] && !refBranchHeads['master']) {
    refBranchHeads['main'] = parsed[parsed.length - 1].hash;
  }

  // --- Assign branch columns in priority order (main/master first) ----------
  const branchNames = Object.keys(refBranchHeads);
  branchNames.sort((a, b) => {
    if (a === 'main' || a === 'master') return -1;
    if (b === 'main' || b === 'master') return 1;
    return 0;
  });

  let colorIdx = 0;
  for (const name of branchNames) {
    const commitId = hashToId[refBranchHeads[name]];
    if (!commitId) continue;
    branches[name] = {
      name,
      color: BRANCH_COLORS[colorIdx % BRANCH_COLORS.length],
      headCommitId: commitId,
    };
    colorIdx++;
  }

  // --- Walk from each branch head backwards (first-parent only) -------------
  const hashParents: Record<string, string[]> = {};
  for (const e of parsed) {
    hashParents[e.hash] = e.parentHashes;
  }

  for (const branchName of branchNames) {
    let hash: string | undefined = refBranchHeads[branchName];
    const visited = new Set<string>();
    while (hash && !visited.has(hash)) {
      visited.add(hash);
      if (!commitBranchMap[hash]) {
        commitBranchMap[hash] = branchName;
      }
      hash = hashParents[hash]?.[0]; // first-parent only
    }
  }

  // --- Third pass: build GitCommit objects (oldest first) -------------------
  const reversedParsed = [...parsed].reverse();

  for (const entry of reversedParsed) {
    const parentIds = entry.parentHashes
      .map((h) => hashToId[h])
      .filter(Boolean);

    const branch = commitBranchMap[entry.hash] || currentBranch;

    const ts = entry.date ? new Date(entry.date).getTime() : Date.now();

    const commit: GitCommit = {
      id: entry.id,
      hash: entry.hash.slice(0, 7),
      message: entry.message,
      timestamp: ts,
      author: entry.author || 'unknown',
      date: entry.date || '',
      branch,
      parentIds,
    };

    commits[entry.id] = commit;
    commitOrder.push(entry.id);
  }

  return { commits, branches, tags, head, currentBranch, commitOrder };
}

export const GIT_LOG_COMMAND =
  'git log --all --format="%H|%P|%D|%an|%aI|%s" --topo-order';

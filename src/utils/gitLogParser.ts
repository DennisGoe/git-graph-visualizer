import { nanoid } from 'nanoid';
import type { GitCommit, GitBranch, GitTag } from '../types/git';
import { BRANCH_COLORS } from '../types/git';

/**
 * Expected input format from:
 * git log --all --format="%H|%P|%D|%s" --topo-order
 *
 * Each line: full_hash|parent_hashes (space sep)|ref_names|subject
 * Example:   abc123|def456 ghi789|HEAD -> main, origin/main|Fix bug
 */

interface ParsedRepo {
  commits: Record<string, GitCommit>;
  branches: Record<string, GitBranch>;
  tags: Record<string, GitTag>;
  head: string;
  currentBranch: string;
  commitOrder: string[];
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

  // Validate format: expect at least one pipe character per line
  const firstLine = lines[0];
  if (!firstLine.includes('|')) {
    return {
      error:
        'Invalid format. Please run this exact command in your repo:\n\ngit log --all --format="%H|%P|%D|%s" --topo-order',
    };
  }

  const commits: Record<string, GitCommit> = {};
  const branches: Record<string, GitBranch> = {};
  const tags: Record<string, GitTag> = {};
  const hashToId: Record<string, string> = {};
  const commitOrder: string[] = [];
  let head = '';
  let currentBranch = 'main';

  // Map to track which branch a commit belongs to
  const commitBranchMap: Record<string, string> = {};

  // First pass: parse all commits and collect refs
  const parsed: Array<{
    hash: string;
    parentHashes: string[];
    refs: string;
    message: string;
    id: string;
  }> = [];

  for (const line of lines) {
    // Split on pipe, but only first 3 pipes (message may contain pipes)
    const pipeIdx1 = line.indexOf('|');
    const pipeIdx2 = line.indexOf('|', pipeIdx1 + 1);
    const pipeIdx3 = line.indexOf('|', pipeIdx2 + 1);

    if (pipeIdx1 === -1 || pipeIdx2 === -1 || pipeIdx3 === -1) {
      continue; // Skip malformed lines
    }

    const hash = line.slice(0, pipeIdx1).trim();
    const parentStr = line.slice(pipeIdx1 + 1, pipeIdx2).trim();
    const refs = line.slice(pipeIdx2 + 1, pipeIdx3).trim();
    const message = line.slice(pipeIdx3 + 1).trim();

    const parentHashes = parentStr ? parentStr.split(/\s+/) : [];
    const id = nanoid();

    hashToId[hash] = id;
    // Also map short hashes (first 7 chars)
    if (hash.length >= 7) {
      hashToId[hash.slice(0, 7)] = id;
    }

    parsed.push({ hash, parentHashes, refs, message, id });
  }

  if (parsed.length === 0) {
    return { error: 'Could not parse any commits from the input.' };
  }

  // Second pass: resolve refs to determine branch assignments
  // Parse refs to find branch names and HEAD
  const refBranchHeads: Record<string, string> = {}; // branchName -> hash

  for (const entry of parsed) {
    if (!entry.refs) continue;

    const refParts = entry.refs.split(',').map((r) => r.trim());

    for (const ref of refParts) {
      // HEAD -> branch_name
      const headMatch = ref.match(/^HEAD\s*->\s*(.+)$/);
      if (headMatch) {
        const branchName = headMatch[1].replace(/^origin\//, '');
        currentBranch = branchName;
        head = entry.id;
        refBranchHeads[branchName] = entry.hash;
        continue;
      }

      // tag: tag_name
      const tagMatch = ref.match(/^tag:\s*(.+)$/);
      if (tagMatch) {
        tags[tagMatch[1]] = {
          name: tagMatch[1],
          commitId: entry.id,
        };
        continue;
      }

      // Skip origin/ refs if we already have the local one
      if (ref.startsWith('origin/')) {
        const localName = ref.replace(/^origin\//, '');
        if (!refBranchHeads[localName]) {
          refBranchHeads[localName] = entry.hash;
        }
        continue;
      }

      // Plain branch name
      if (ref !== 'HEAD') {
        refBranchHeads[ref] = entry.hash;
      }
    }
  }

  // If no HEAD found, use first commit
  if (!head && parsed.length > 0) {
    head = parsed[0].id;
  }

  // Assign branches: walk from each branch head backward
  // First, ensure main/master exists
  if (!refBranchHeads['main'] && !refBranchHeads['master']) {
    // Use the branch of the last commit (root) as main
    const rootEntry = parsed[parsed.length - 1];
    refBranchHeads['main'] = rootEntry.hash;
  }

  // Build parent lookup for traversal
  const hashParents: Record<string, string[]> = {};
  for (const entry of parsed) {
    hashParents[entry.hash] = entry.parentHashes;
  }

  // Assign colors to branches
  let colorIdx = 0;
  const branchNames = Object.keys(refBranchHeads);
  // Ensure main/master is first
  branchNames.sort((a, b) => {
    if (a === 'main' || a === 'master') return -1;
    if (b === 'main' || b === 'master') return 1;
    return 0;
  });

  for (const name of branchNames) {
    const hash = refBranchHeads[name];
    const commitId = hashToId[hash];
    if (!commitId) continue;

    branches[name] = {
      name,
      color: BRANCH_COLORS[colorIdx % BRANCH_COLORS.length],
      headCommitId: commitId,
    };
    colorIdx++;
  }

  // Walk from each branch head backward and assign commits to branches
  // Priority: first branch to claim a commit wins
  for (const branchName of branchNames) {
    const startHash = refBranchHeads[branchName];
    const queue = [startHash];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const hash = queue.shift()!;
      if (visited.has(hash)) continue;
      visited.add(hash);

      if (!commitBranchMap[hash]) {
        commitBranchMap[hash] = branchName;
      }

      const parents = hashParents[hash] || [];
      // Only follow the first parent for branch assignment
      // (second parent is the merge source — belongs to another branch)
      if (parents[0]) {
        queue.push(parents[0]);
      }
    }
  }

  // Third pass: build commit objects (topo-order is reversed for our display)
  // git log --topo-order gives newest first, we want oldest first for commitOrder
  const reversedParsed = [...parsed].reverse();

  for (const entry of reversedParsed) {
    const parentIds = entry.parentHashes
      .map((h) => hashToId[h])
      .filter(Boolean);

    const branch = commitBranchMap[entry.hash] || currentBranch;

    const commit: GitCommit = {
      id: entry.id,
      hash: entry.hash.slice(0, 7),
      message: entry.message,
      timestamp: Date.now(),
      branch,
      parentIds,
    };

    commits[entry.id] = commit;
    commitOrder.push(entry.id);
  }

  return {
    commits,
    branches,
    tags,
    head,
    currentBranch,
    commitOrder,
  };
}

export const GIT_LOG_COMMAND =
  'git log --all --format="%H|%P|%D|%s" --topo-order';

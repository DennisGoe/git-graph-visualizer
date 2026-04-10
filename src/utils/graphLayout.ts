import type { GitCommit, GitBranch, LayoutNode, LayoutEdge } from '../types/git';

const COLUMN_WIDTH = 200;
const ROW_HEIGHT = 90;
const GRAPH_LEFT_PAD = 80;

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
  columnCount: number;
}

/**
 * Layout algorithm that keeps branch lanes tight.
 *
 * For each commit (newest -> oldest) we assign a column:
 * - If this commit is a branch head -> give it the column reserved for that branch
 * - Otherwise inherit the column from its child (the commit that lists us as parent[0])
 *
 * Merge parents (parent index > 0) get their own lane if they don't already have one.
 */
export function computeGraphLayout(
  commits: Record<string, GitCommit>,
  commitOrder: string[],
  branches: Record<string, GitBranch>,
): LayoutResult {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  // Order: newest first (for top-down display)
  const ordered = [...commitOrder].reverse();

  // Assign fixed columns to branches. main/master = 0, rest follow.
  const branchColumn: Record<string, number> = {};
  let nextCol = 0;
  const sortedBranches = Object.keys(branches).sort((a, b) => {
    if (a === 'main' || a === 'master') return -1;
    if (b === 'main' || b === 'master') return 1;
    return 0;
  });
  for (const name of sortedBranches) {
    branchColumn[name] = nextCol++;
  }

  // Map: commitId -> column
  const commitColumn: Record<string, number> = {};

  // Mark branch-head commits
  const branchHeadSet = new Set<string>();
  for (const b of Object.values(branches)) {
    branchHeadSet.add(b.headCommitId);
    commitColumn[b.headCommitId] = branchColumn[b.name] ?? 0;
  }

  // First-child map: for each commit, which child has us as parent[0]?
  // This lets non-head commits inherit their child's column.
  const firstChildOf: Record<string, string> = {};
  for (const id of ordered) {
    const c = commits[id];
    if (!c) continue;
    if (c.parentIds[0] && !firstChildOf[c.parentIds[0]]) {
      firstChildOf[c.parentIds[0]] = id;
    }
  }

  // Assign columns: walk newest -> oldest
  for (const id of ordered) {
    if (commitColumn[id] !== undefined) continue;

    const c = commits[id];
    if (!c) continue;

    // Try inheriting from child
    const child = firstChildOf[id];
    if (child && commitColumn[child] !== undefined) {
      commitColumn[id] = commitColumn[child];
    } else {
      // Fall back to branch column
      commitColumn[id] = branchColumn[c.branch] ?? 0;
    }
  }

  // Build nodes
  for (let row = 0; row < ordered.length; row++) {
    const id = ordered[row];
    const col = commitColumn[id] ?? 0;
    nodes.push({
      id,
      x: GRAPH_LEFT_PAD + col * COLUMN_WIDTH + COLUMN_WIDTH / 2,
      y: 60 + row * ROW_HEIGHT,
      column: col,
      row,
    });
  }

  const nodeMap = new Map<string, LayoutNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Build edges
  for (const id of commitOrder) {
    const c = commits[id];
    if (!c) continue;
    for (let i = 0; i < c.parentIds.length; i++) {
      const pid = c.parentIds[i];
      if (nodeMap.has(pid) && nodeMap.has(id)) {
        edges.push({
          source: pid,
          target: id,
          type: i > 0 ? 'merge' : 'normal',
          sourceBranch: commits[pid]?.branch || c.branch,
        });
      }
    }
  }

  const maxCol = Math.max(0, ...nodes.map((n) => n.column));
  const graphWidth = GRAPH_LEFT_PAD + (maxCol + 1) * COLUMN_WIDTH + 80;
  const height = 90 + ordered.length * ROW_HEIGHT;

  return { nodes, edges, width: graphWidth, height, columnCount: maxCol + 1 };
}

export function buildEdgePath(
  source: LayoutNode,
  target: LayoutNode,
): string {
  const sx = source.x;
  const sy = source.y;
  const tx = target.x;
  const ty = target.y;

  if (sx === tx) {
    return `M ${sx} ${sy} L ${tx} ${ty}`;
  }

  // n8n-style smooth cubic bezier: curve out horizontally then ease into target
  const midY = (sy + ty) / 2;
  return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
}

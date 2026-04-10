import type { GitCommit, GitBranch, LayoutNode, LayoutEdge } from '../types/git';

const NODE_SPACING_X = 80;
const NODE_SPACING_Y = 70;

interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

export function computeGraphLayout(
  commits: Record<string, GitCommit>,
  commitOrder: string[],
  branches: Record<string, GitBranch>,
): LayoutResult {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  // Assign columns to branches
  const branchColumns: Record<string, number> = {};
  let nextColumn = 0;

  // main always gets column 0
  if (branches['main']) {
    branchColumns['main'] = 0;
    nextColumn = 1;
  }

  for (const branchName of Object.keys(branches)) {
    if (branchName === 'main') continue;
    if (branchColumns[branchName] === undefined) {
      branchColumns[branchName] = nextColumn++;
    }
  }

  // Build layout nodes — newest at top (reverse order)
  const orderedIds = [...commitOrder].reverse();

  for (let row = 0; row < orderedIds.length; row++) {
    const commitId = orderedIds[row];
    const commit = commits[commitId];
    if (!commit) continue;

    const column = branchColumns[commit.branch] ?? 0;

    nodes.push({
      id: commitId,
      x: 60 + column * NODE_SPACING_X,
      y: 40 + row * NODE_SPACING_Y,
      column,
      row,
    });
  }

  // Build node lookup
  const nodeMap = new Map<string, LayoutNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Build edges from parent relationships
  for (const commitId of commitOrder) {
    const commit = commits[commitId];
    if (!commit) continue;

    for (let i = 0; i < commit.parentIds.length; i++) {
      const parentId = commit.parentIds[i];
      if (nodeMap.has(parentId) && nodeMap.has(commitId)) {
        edges.push({
          source: parentId,
          target: commitId,
          type: i > 0 ? 'merge' : 'normal',
        });
      }
    }
  }

  const maxColumn = Math.max(0, ...nodes.map((n) => n.column));
  const width = 120 + maxColumn * NODE_SPACING_X;
  const height = 80 + orderedIds.length * NODE_SPACING_Y;

  return { nodes, edges, width, height };
}

export function buildEdgePath(
  sourceNode: LayoutNode,
  targetNode: LayoutNode,
): string {
  const sx = sourceNode.x;
  const sy = sourceNode.y;
  const tx = targetNode.x;
  const ty = targetNode.y;

  if (sx === tx) {
    // Straight vertical line
    return `M ${sx} ${sy} L ${tx} ${ty}`;
  }

  // Curved path for cross-branch edges
  const midY = (sy + ty) / 2;
  return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
}

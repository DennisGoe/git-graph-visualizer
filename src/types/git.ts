export interface GitCommit {
  id: string;
  hash: string;
  message: string;
  timestamp: number;
  author: string;
  date: string;
  branch: string;
  parentIds: string[];
  x?: number;
  y?: number;
}

export interface GitBranch {
  name: string;
  color: string;
  headCommitId: string;
}

export interface GitTag {
  name: string;
  commitId: string;
}

export interface GitState {
  commits: Record<string, GitCommit>;
  branches: Record<string, GitBranch>;
  tags: Record<string, GitTag>;
  head: string;
  currentBranch: string;
  commitOrder: string[];
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: number;
}

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  column: number;
  row: number;
}

export interface LayoutEdge {
  source: string;
  target: string;
  type: 'normal' | 'merge';
  sourceBranch: string;
}

export interface LaneInfo {
  branchName: string;
  column: number;
  color: string;
  x: number;
  minY: number;
  maxY: number;
}

export type BranchColorMap = Record<string, string>;

export const BRANCH_COLORS = [
  '#58a6ff', // blue
  '#3fb950', // green
  '#bc8cff', // purple
  '#d29922', // orange
  '#f85149', // red
  '#39d2c0', // cyan
  '#f778ba', // pink
  '#79c0ff', // light blue
  '#7ee787', // light green
  '#d2a8ff', // light purple
];

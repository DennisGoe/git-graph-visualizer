import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import type { GitState, GitCommit, GitTag } from '../types/git';
import { BRANCH_COLORS } from '../types/git';

function shortHash(): string {
  return nanoid(7).toLowerCase().replace(/[^a-z0-9]/g, 'a');
}

function createCommit(
  message: string,
  branch: string,
  parentIds: string[],
): GitCommit {
  const id = nanoid();
  return {
    id,
    hash: shortHash(),
    message,
    timestamp: Date.now(),
    branch,
    parentIds,
  };
}

const initialCommit = createCommit('Initial commit', 'main', []);

const initialState: GitState = {
  commits: { [initialCommit.id]: initialCommit },
  branches: {
    main: {
      name: 'main',
      color: BRANCH_COLORS[0],
      headCommitId: initialCommit.id,
    },
  },
  tags: {},
  head: initialCommit.id,
  currentBranch: 'main',
  commitOrder: [initialCommit.id],
};

let colorIndex = 1;
function nextColor(): string {
  const color = BRANCH_COLORS[colorIndex % BRANCH_COLORS.length];
  colorIndex++;
  return color;
}

const gitSlice = createSlice({
  name: 'git',
  initialState,
  reducers: {
    commit(state, action: PayloadAction<{ message: string }>) {
      const branch = state.currentBranch;
      const branchData = state.branches[branch];
      if (!branchData) return;

      const newCommit = createCommit(action.payload.message, branch, [
        branchData.headCommitId,
      ]);
      state.commits[newCommit.id] = newCommit;
      state.branches[branch].headCommitId = newCommit.id;
      state.head = newCommit.id;
      state.commitOrder.push(newCommit.id);
    },

    createBranch(state, action: PayloadAction<{ name: string }>) {
      const { name } = action.payload;
      if (state.branches[name]) return;

      state.branches[name] = {
        name,
        color: nextColor(),
        headCommitId: state.head,
      };
    },

    checkout(state, action: PayloadAction<{ branch: string }>) {
      const { branch } = action.payload;
      const branchData = state.branches[branch];
      if (!branchData) return;

      state.currentBranch = branch;
      state.head = branchData.headCommitId;
    },

    merge(state, action: PayloadAction<{ sourceBranch: string }>) {
      const { sourceBranch } = action.payload;
      const source = state.branches[sourceBranch];
      const target = state.branches[state.currentBranch];
      if (!source || !target) return;
      if (source.headCommitId === target.headCommitId) return;

      const mergeCommit = createCommit(
        `Merge branch '${sourceBranch}' into ${state.currentBranch}`,
        state.currentBranch,
        [target.headCommitId, source.headCommitId],
      );
      state.commits[mergeCommit.id] = mergeCommit;
      state.branches[state.currentBranch].headCommitId = mergeCommit.id;
      state.head = mergeCommit.id;
      state.commitOrder.push(mergeCommit.id);
    },

    tag(state, action: PayloadAction<{ name: string }>) {
      const { name } = action.payload;
      if (state.tags[name]) return;

      const newTag: GitTag = {
        name,
        commitId: state.head,
      };
      state.tags[name] = newTag;
    },

    deleteBranch(state, action: PayloadAction<{ name: string }>) {
      const { name } = action.payload;
      if (name === state.currentBranch) return;
      if (name === 'main') return;
      delete state.branches[name];
    },

    importRepo(_state, action: PayloadAction<GitState>) {
      colorIndex = Object.keys(action.payload.branches).length;
      return action.payload;
    },

    reset(_state) {
      colorIndex = 1;
      return initialState;
    },
  },
});

export const { commit, createBranch, checkout, merge, tag, deleteBranch, importRepo, reset } =
  gitSlice.actions;
export default gitSlice.reducer;

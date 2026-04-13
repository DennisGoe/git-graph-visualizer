import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  selectedCommitId: string | null;
  hoveredCommitId: string | null;
  selectedBranchName: string | null;
  sidebarOpen: boolean;
  animationsEnabled: boolean;
}

const initialState: UiState = {
  selectedCommitId: null,
  hoveredCommitId: null,
  selectedBranchName: null,
  sidebarOpen: true,
  animationsEnabled: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    selectCommit(state, action: PayloadAction<string | null>) {
      state.selectedCommitId = action.payload;
    },
    hoverCommit(state, action: PayloadAction<string | null>) {
      state.hoveredCommitId = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleAnimations(state) {
      state.animationsEnabled = !state.animationsEnabled;
    },
    selectBranch(state, action: PayloadAction<string | null>) {
      state.selectedBranchName =
        state.selectedBranchName === action.payload ? null : action.payload;
    },
  },
});

export const { selectCommit, hoverCommit, toggleSidebar, toggleAnimations, selectBranch } =
  uiSlice.actions;
export default uiSlice.reducer;

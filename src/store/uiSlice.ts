import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  selectedCommitId: string | null;
  hoveredCommitId: string | null;
  sidebarOpen: boolean;
  animationsEnabled: boolean;
}

const initialState: UiState = {
  selectedCommitId: null,
  hoveredCommitId: null,
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
  },
});

export const { selectCommit, hoverCommit, toggleSidebar, toggleAnimations } =
  uiSlice.actions;
export default uiSlice.reducer;

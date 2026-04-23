import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Provider = 'gitlab' | 'github' | 'local';

interface ProjectState {
  provider: Provider;
  instanceUrl: string;
  projectPath: string;
  token: string;
}

const initialState: ProjectState = {
  provider: 'local',
  instanceUrl: '',
  projectPath: '',
  token: '',
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setGitLabContext(
      state,
      action: PayloadAction<{ instanceUrl: string; projectPath: string; token: string }>,
    ) {
      state.provider = 'gitlab';
      state.instanceUrl = action.payload.instanceUrl;
      state.projectPath = action.payload.projectPath;
      state.token = action.payload.token;
    },
    clearProject(state) {
      state.provider = 'local';
      state.instanceUrl = '';
      state.projectPath = '';
      state.token = '';
    },
  },
});

export const { setGitLabContext, clearProject } = projectSlice.actions;
export default projectSlice.reducer;

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type PipelineState =
  | 'working'   // running / preparing
  | 'waiting'   // pending / created / scheduled / waiting_for_resource
  | 'idle'      // success / manual / skipped / no pipeline
  | 'failed'    // failed
  | 'off';      // canceled

export interface BranchPipeline {
  state: PipelineState;
  rawStatus: string;
  webUrl: string | null;
  updatedAt: number;
}

interface PipelinesState {
  byBranch: Record<string, BranchPipeline>;
  lastFetched: number;
  isFetching: boolean;
}

const initialState: PipelinesState = {
  byBranch: {},
  lastFetched: 0,
  isFetching: false,
};

const pipelinesSlice = createSlice({
  name: 'pipelines',
  initialState,
  reducers: {
    setPipelines(state, action: PayloadAction<Record<string, BranchPipeline>>) {
      state.byBranch = action.payload;
      state.lastFetched = Date.now();
      state.isFetching = false;
    },
    setFetching(state, action: PayloadAction<boolean>) {
      state.isFetching = action.payload;
    },
    clearPipelines(state) {
      state.byBranch = {};
      state.lastFetched = 0;
      state.isFetching = false;
    },
  },
});

export const { setPipelines, setFetching, clearPipelines } = pipelinesSlice.actions;
export default pipelinesSlice.reducer;

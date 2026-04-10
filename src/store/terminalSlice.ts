import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import type { TerminalLine } from '../types/git';

interface TerminalState {
  lines: TerminalLine[];
  history: string[];
  historyIndex: number;
}

const initialState: TerminalState = {
  lines: [
    {
      id: nanoid(),
      type: 'output',
      content:
        'Welcome to Git Graph Visualizer. Type "help" for available commands.',
      timestamp: Date.now(),
    },
  ],
  history: [],
  historyIndex: -1,
};

const terminalSlice = createSlice({
  name: 'terminal',
  initialState,
  reducers: {
    addLine(
      state,
      action: PayloadAction<{ type: TerminalLine['type']; content: string }>,
    ) {
      state.lines.push({
        id: nanoid(),
        type: action.payload.type,
        content: action.payload.content,
        timestamp: Date.now(),
      });
    },

    addToHistory(state, action: PayloadAction<string>) {
      state.history.push(action.payload);
      state.historyIndex = state.history.length;
    },

    setHistoryIndex(state, action: PayloadAction<number>) {
      state.historyIndex = action.payload;
    },

    clearTerminal(state) {
      state.lines = [];
    },
  },
});

export const { addLine, addToHistory, setHistoryIndex, clearTerminal } =
  terminalSlice.actions;
export default terminalSlice.reducer;

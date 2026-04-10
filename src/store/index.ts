import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import gitReducer from './gitSlice';
import terminalReducer from './terminalSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    git: gitReducer,
    terminal: terminalReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

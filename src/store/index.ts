import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import gitReducer from './gitSlice';
import uiReducer from './uiSlice';
import projectReducer from './projectSlice';
import pipelinesReducer from './pipelinesSlice';

export const store = configureStore({
  reducer: {
    git: gitReducer,
    ui: uiReducer,
    project: projectReducer,
    pipelines: pipelinesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

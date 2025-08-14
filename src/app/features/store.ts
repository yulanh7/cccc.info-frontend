import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/slice';
import groupsReducer from './groups/slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    groups: groupsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
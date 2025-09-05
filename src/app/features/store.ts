import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/slice';
import groupsReducer from './groups/slice';
import groupDetailReducer from './groups/detailSlice';
import postsReducer from './posts/slice';
import likesReducer from './posts/likeSlice';
import commentsReducer from "@/app/features/posts/commentsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    groups: groupsReducer,
    groupDetail: groupDetailReducer,
    posts: postsReducer,
    likes: likesReducer,
    comments: commentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
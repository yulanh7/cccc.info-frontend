import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createPost, fetchPosts, getPost, editPost, deletePost } from './api';
import { CreatePostCredentials, EditPostCredentials, PostProps } from '@/app/types/post';

interface GroupState {
  posts: PostProps[];
  currentPost: PostProps | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: GroupState = {
  posts: [],
  currentPost: null,
  status: 'idle',
  error: null,
};

export const createPostThunk = createAsyncThunk(
  'group/createPost',
  async ({ groupId, credentials }: { groupId: number; credentials: CreatePostCredentials }, { dispatch, rejectWithValue }) => {
    try {
      const response = await createPost(groupId, credentials);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create post');
      }
      // Fetch all posts after creation
      await dispatch(fetchPostsThunk(groupId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create post');
    }
  }
);

export const fetchPostsThunk = createAsyncThunk(
  'group/fetchPosts',
  async (groupId: number, { rejectWithValue }) => {
    try {
      const response = await fetchPosts(groupId);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch posts');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch posts');
    }
  }
);

export const getPostThunk = createAsyncThunk(
  'group/getPost',
  async ({ groupId, postId }: { groupId: number; postId: number }, { rejectWithValue }) => {
    try {
      const response = await getPost(groupId, postId);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to get post');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get post');
    }
  }
);

export const editPostThunk = createAsyncThunk(
  'group/editPost',
  async (
    { groupId, postId, credentials }: { groupId: number; postId: number; credentials: EditPostCredentials },
    { rejectWithValue }
  ) => {
    try {
      const response = await editPost(groupId, postId, credentials);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to edit post');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to edit post');
    }
  }
);

export const deletePostThunk = createAsyncThunk(
  'group/deletePost',
  async ({ groupId, postId }: { groupId: number; postId: number }, { dispatch, rejectWithValue }) => {
    try {
      const response = await deletePost(groupId, postId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete post');
      }
      // Fetch all posts after deletion
      await dispatch(fetchPostsThunk(groupId));
      return postId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete post');
    }
  }
);

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createPostThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createPostThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentPost = action.payload;
      })
      .addCase(createPostThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchPostsThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPostsThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.posts = action.payload;
      })
      .addCase(fetchPostsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(getPostThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getPostThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentPost = action.payload;
      })
      .addCase(getPostThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(editPostThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(editPostThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentPost = action.payload;
        const index = state.posts.findIndex((post) => post.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
      })
      .addCase(editPostThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(deletePostThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deletePostThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentPost = null;
      })
      .addCase(deletePostThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export default groupSlice.reducer;
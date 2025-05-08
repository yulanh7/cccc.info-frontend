import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { login, signup } from './api';
import { AuthUserProps } from '@/app/types/user';

interface AuthState {
  user: AuthUserProps | null;
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
};

export const loginThunk = createAsyncThunk('auth/login', async (credentials: { email: string; password: string }, { rejectWithValue }) => {
  try {
    const response = await login(credentials);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }
    return { user: response.data, token: response.data.token };
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const signupThunk = createAsyncThunk('auth/signup', async (credentials: { email: string; username: string; password: string }, { rejectWithValue }) => {
  try {
    const response = await signup(credentials);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Signup failed');
    }
    return { user: response.data, token: response.data.token };
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(signupThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
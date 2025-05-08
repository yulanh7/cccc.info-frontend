import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { login, signup } from './api';
import { AuthResponse, AuthResponseData } from '@/app/types/user';

interface AuthState {
  user: AuthResponseData | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle',
  error: null,
};

export const loginThunk = createAsyncThunk('auth/login', async (credentials: { email: string; password: string }, { rejectWithValue }) => {
  try {
    const response = await login(credentials);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }
    return { user: response.data, accessToken: response.data.access_token, refreshToken: response.data.refresh_token };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Login failed');
  }
});

export const signupThunk = createAsyncThunk('auth/signup', async (credentials: { email: string; firstName: string; password: string }, { rejectWithValue }) => {
  try {
    const response = await signup(credentials);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Signup failed');
    }
    return { user: response.data, accessToken: response.data.access_token, refreshToken: response.data.refresh_token };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Signup failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(signupThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
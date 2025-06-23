import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiRequest from '../request';
import { clearAuth, storeToken, getToken, getUser } from './token';
import { UserProps, AuthResponseData } from '@/app/types/user';
import { LoginCredentials, SignupCredentials } from '@/app/types/auth';

interface AuthState {
  user: UserProps | null;
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

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
} as const;

export const loginThunk = createAsyncThunk(
  `${AUTH_ENDPOINTS.LOGIN}`,
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await apiRequest<AuthResponseData>('POST', AUTH_ENDPOINTS.LOGIN, credentials, false);
      if (!response.success || !response.data) {
        throw new Error(response.message || '登录失败');
      }
      storeToken(response.data);
      return {
        user: response.data.user,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || '登录失败');
    }
  }
);

export const signupThunk = createAsyncThunk(
  `${AUTH_ENDPOINTS.SIGNUP}`,
  async (credentials: SignupCredentials, { rejectWithValue }) => {
    try {
      const response = await apiRequest<AuthResponseData>('POST', AUTH_ENDPOINTS.SIGNUP, credentials, false);
      if (!response.success || !response.data) {
        throw new Error(response.message || '注册失败');
      }
      storeToken(response.data);
      return {
        user: response.data.user,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || '注册失败');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      clearAuth();
    },
    rehydrateAuth: (state) => {
      const user = getUser();
      const accessToken = getToken();
      if (user && accessToken) {
        state.user = user;
        state.accessToken = accessToken;
        // 可选：refreshToken 也可以加上
      }
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

export const { logout, rehydrateAuth } = authSlice.actions;
export default authSlice.reducer;
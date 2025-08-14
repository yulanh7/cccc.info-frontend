import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import {
  clearAuth,
  storeToken,
  getToken,
  getUser,
  getRefreshToken,
} from './token';
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
  LOGOUT: '/auth/logout',
} as const;

export type AuthThunkReturn = {
  user: UserProps;
  accessToken: string;
  refreshToken: string;
};

// ====== Login ======
export const loginThunk = createAsyncThunk<AuthThunkReturn, LoginCredentials>(
  `${AUTH_ENDPOINTS.LOGIN}`,
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await apiRequest<AuthResponseData>(
        'POST',
        AUTH_ENDPOINTS.LOGIN,
        credentials,
        false
      );
      if (!res.success || !res.data)
        throw new Error(res.message || 'Login failed');
      storeToken(res.data);
      return {
        user: res.data.user,
        accessToken: res.data.access_token,
        refreshToken: res.data.refresh_token,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed') as any;
    }
  }
);

// ====== Signup ======
export const signupThunk = createAsyncThunk<AuthThunkReturn, SignupCredentials>(
  `${AUTH_ENDPOINTS.SIGNUP}`,
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await apiRequest<AuthResponseData>(
        'POST',
        AUTH_ENDPOINTS.SIGNUP,
        credentials,
        false
      );
      if (!res.success || !res.data)
        throw new Error(res.message || 'Signup failed');
      storeToken(res.data);
      return {
        user: res.data.user,
        accessToken: res.data.access_token,
        refreshToken: res.data.refresh_token,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Signup failed') as any;
    }
  }
);

// ====== Logout (calls backend API and clears local state) ======
export const logoutThunk = createAsyncThunk<boolean, void>(
  `${AUTH_ENDPOINTS.LOGOUT}`,
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{}>('POST', AUTH_ENDPOINTS.LOGOUT, {}, true);
      if (!res.success) throw new Error(res.message || 'Logout failed');
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed') as any;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Restore auth state from localStorage on app initialization
    rehydrateAuth: (state) => {
      const user = getUser();
      const accessToken = getToken();
      const refreshToken = getRefreshToken();
      if (user) state.user = user;
      if (accessToken) state.accessToken = accessToken;
      if (refreshToken) state.refreshToken = refreshToken;
    },
    // Called when access token is refreshed successfully
    accessTokenRefreshed: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
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
      // signup
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
      })
      // logout (clear state regardless of API result)
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        clearAuth();
      })
      .addCase(logoutThunk.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        clearAuth();
      });
  },
});

export const { rehydrateAuth, accessTokenRefreshed } = authSlice.actions;
export default authSlice.reducer;

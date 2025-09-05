import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import {
  clearAuth,
  storeToken,
  getToken,
  getUser,
  getRefreshToken,
  setAccessToken,
  setUser as persistUser,
} from './token';
import {
  UserProps,
  AuthResponseData,
  ProfileGetResponse,
  ProfileUpdateBody,
  ProfileUpdateResponse,
  ProfileGetData,
} from '@/app/types/user';
import { LoginCredentials, SignupCredentials } from '@/app/types/auth';

interface AuthState {
  user: UserProps | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  profileStatus: 'idle' | 'loading' | 'saving' | 'succeeded' | 'failed';
  profileError: string | null;
  savingProfile: boolean;
  passwordStatus: 'idle' | 'changing' | 'succeeded' | 'failed';
  passwordError: string | null;
  changingPassword: boolean;
}
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle',
  error: null,
  profileStatus: 'idle',
  profileError: null,
  savingProfile: false,
  passwordStatus: 'idle',
  passwordError: null,
  changingPassword: false,
};


const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
} as const;

const USER_ENDPOINTS = {
  PROFILE: '/user/profile'
} as const;

export type AuthThunkReturn = {
  user: UserProps;
  accessToken: string;
  refreshToken: string;
};

// ====== Login ======
export const loginThunk = createAsyncThunk<
  AuthThunkReturn,
  LoginCredentials,
  { rejectValue: string }
>(`${AUTH_ENDPOINTS.LOGIN}`, async (credentials, { rejectWithValue }) => {
  try {
    const res = await apiRequest<AuthResponseData>('POST', AUTH_ENDPOINTS.LOGIN, credentials, false);
    if (!res.success || !res.data) throw new Error(res.message || 'Login failed');
    storeToken(res.data);
    return {
      user: res.data.user,
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
    };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Login failed');
  }
});

export const signupThunk = createAsyncThunk<
  AuthThunkReturn,
  SignupCredentials,
  { rejectValue: string }
>(`${AUTH_ENDPOINTS.SIGNUP}`, async (credentials, { rejectWithValue }) => {
  try {
    const res = await apiRequest<AuthResponseData>('POST', AUTH_ENDPOINTS.SIGNUP, credentials, false);
    if (!res.success || !res.data) throw new Error(res.message || 'Signup failed');
    storeToken(res.data);
    return {
      user: res.data.user,
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
    };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Signup failed');
  }
});

export const logoutThunk = createAsyncThunk<boolean, void, { rejectValue: string }>(
  `${AUTH_ENDPOINTS.LOGOUT}`,
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{}>('POST', AUTH_ENDPOINTS.LOGOUT, {}, true);
      if (!res.success) throw new Error(res.message || 'Logout failed');
      return true;
    } catch (e: any) {
      return rejectWithValue(e.message || 'Logout failed');
    }
  }
);




export const fetchProfileThunk = createAsyncThunk<UserProps, void, { rejectValue: string }>(
  `${USER_ENDPOINTS.PROFILE}/get`,
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiRequest<ProfileGetData>('GET', USER_ENDPOINTS.PROFILE);
      if (!res.success || !res.data?.user) throw new Error(res.message || 'Failed to load profile');
      persistUser(res.data.user);
      return res.data.user;
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to load profile');
    }
  }
);

export const refreshThunk = createAsyncThunk<
  { accessToken: string },
  void,
  { rejectValue: string }
>(`${AUTH_ENDPOINTS.REFRESH}`, async (_, { rejectWithValue, dispatch }) => {
  try {
    // 根据你的 apiRequest 约定：带 refresh token 或 cookie
    const res = await apiRequest<{ access_token: string }>('POST', AUTH_ENDPOINTS.REFRESH, {}, false);
    if (!res?.success || !res?.data?.access_token) throw new Error(res?.message || 'Refresh failed');
    dispatch(accessTokenRefreshed(res.data.access_token)); // 同步到 store + localStorage
    return { accessToken: res.data.access_token };
  } catch (e: any) {
    return rejectWithValue(e.message || 'Refresh failed');
  }
});


export const saveProfileNameThunk = createAsyncThunk<
  { firstName: string },
  { firstName: string },
  { rejectValue: string }
>('auth/saveProfileName', async ({ firstName }, { rejectWithValue }) => {
  try {
    const res = await apiRequest('PUT', USER_ENDPOINTS.PROFILE, { firstName });
    if (!res?.success) throw new Error(res?.message || 'Update profile failed');
    return { firstName };
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Update profile failed');
  }
});

export const changePasswordThunk = createAsyncThunk<
  void,
  { oldPassword: string; newPassword: string },
  { rejectValue: string }
>('auth/changePassword', async ({ oldPassword, newPassword }, { rejectWithValue }) => {
  try {
    const res = await apiRequest('PUT', USER_ENDPOINTS.PROFILE, {
      password: { oldPassword, newPassword },
    });
    if (!res?.success) throw new Error(res?.message || 'Change password failed');
    return;
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Change password failed');
  }
});


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
      // 同时更新 token.ts
      setAccessToken(action.payload);
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
        state.error = action.payload ?? (action.error.message || 'Login failed');
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
        state.error = action.payload ?? (action.error.message || 'Signup failed');
      })
      // logout
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
      })
      // fetch profile
      .addCase(fetchProfileThunk.pending, (state) => {
        state.profileStatus = 'loading';
        state.profileError = null;
      })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.profileStatus = 'succeeded';
        state.user = action.payload;
      })
      .addCase(fetchProfileThunk.rejected, (state, action) => {
        state.profileStatus = 'failed';
        state.profileError = action.payload ?? (action.error.message || 'Failed to load profile');
      })
    builder
      .addCase(saveProfileNameThunk.pending, (state) => {
        state.savingProfile = true;
        state.profileStatus = 'saving';
        state.profileError = null;
      })
      .addCase(saveProfileNameThunk.fulfilled, (state, action) => {
        state.savingProfile = false;
        state.profileStatus = 'succeeded';
        state.profileError = null;
        if (state.user) {
          state.user.firstName = action.payload.firstName;
        }
      })
      .addCase(saveProfileNameThunk.rejected, (state, action) => {
        state.savingProfile = false;
        state.profileStatus = 'failed';
        state.profileError = action.payload ?? 'Update profile failed';
      });
    builder
      .addCase(changePasswordThunk.pending, (state) => {
        state.changingPassword = true;
        state.passwordStatus = 'changing';
        state.passwordError = null;
      })
      .addCase(changePasswordThunk.fulfilled, (state) => {
        state.changingPassword = false;
        state.passwordStatus = 'succeeded';
        state.passwordError = null;
      })
      .addCase(changePasswordThunk.rejected, (state, action) => {
        state.changingPassword = false;
        state.passwordStatus = 'failed';
        state.passwordError = action.payload ?? (action.error.message || 'Change password failed');
      });
  },
});

export const { rehydrateAuth, accessTokenRefreshed } = authSlice.actions;
export default authSlice.reducer;

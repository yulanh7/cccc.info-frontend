import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../request';
import { unwrapData } from '@/app/types';
import type { LoadStatus } from '@/app/types';
import type {
  UserProps,
  AdminUsersListData,
  UpdateUserPermissionBody,
} from '@/app/types/user';

interface AdminUsersState {
  users: UserProps[];
  pagination: AdminUsersListData['pagination'] | null;
  status: LoadStatus;
  error: string | null;
  /** 正在切换权限的用户 id */
  updatingIds: number[];
}

const initialState: AdminUsersState = {
  users: [],
  pagination: null,
  status: 'idle',
  error: null,
  updatingIds: [],
};

const ADMIN_ENDPOINTS = {
  USERS: '/admin/users',
  USER_PERMISSIONS: (userId: number) => `/admin/users/${userId}/permissions`,
  USER_ADMIN: (userId: number) => `/admin/users/${userId}/admin`,
} as const;

// ===== 用户列表：GET /api/admin/users（仅 admin）
export const fetchAdminUsers = createAsyncThunk<
  AdminUsersListData,
  { page?: number; per_page?: number; q?: string }
>('adminUsers/fetchAdminUsers', async ({ page = 1, per_page = 20, q }, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    qs.set('page', String(page));
    qs.set('per_page', String(per_page));
    if (q) qs.set('q', q);

    const res = await apiRequest<AdminUsersListData>('GET', `${ADMIN_ENDPOINTS.USERS}?${qs.toString()}`);
    return unwrapData(res);
  } catch (e: any) {
    return rejectWithValue(e.message || 'Fetch users failed') as any;
  }
});

// ===== 开/关某个用户的权限：PATCH /api/admin/users/{user_id}/permissions
// 用那一行用户自己的 id；返回更新后的 user，用它替换那一行
export const setUserPermission = createAsyncThunk<
  UserProps,
  { userId: number } & UpdateUserPermissionBody
>('adminUsers/setUserPermission', async ({ userId, ...body }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<UserProps>('PATCH', ADMIN_ENDPOINTS.USER_PERMISSIONS(userId), body);
    return unwrapData(res);
  } catch (e: any) {
    return rejectWithValue(e.message || 'Update permission failed') as any;
  }
});

// ===== 设为 admin / 改回普通用户：PATCH /api/admin/users/{user_id}/admin
// 不能取消自己、不能取消最后一个 admin（后端 400）；改回普通用户时后端自动去掉 manage_groups
export const setUserAdmin = createAsyncThunk<UserProps, { userId: number; admin: boolean }>(
  'adminUsers/setUserAdmin',
  async ({ userId, admin }, { rejectWithValue }) => {
    try {
      const res = await apiRequest<UserProps>('PATCH', ADMIN_ENDPOINTS.USER_ADMIN(userId), { admin });
      return unwrapData(res);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Update admin role failed') as any;
    }
  }
);

const adminUsersSlice = createSlice({
  name: 'adminUsers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminUsers.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.users = a.payload.users ?? [];
        s.pagination = a.payload.pagination ?? null;
      })
      .addCase(fetchAdminUsers.rejected, (s, a) => {
        s.status = 'failed';
        s.error = (a.payload as string) || 'Fetch users failed';
      });

    builder
      .addCase(setUserPermission.pending, (s, a) => {
        s.updatingIds.push(a.meta.arg.userId);
      })
      .addCase(setUserPermission.fulfilled, (s, a) => {
        s.updatingIds = s.updatingIds.filter((id) => id !== a.meta.arg.userId);
        const idx = s.users.findIndex((u) => u.id === a.payload.id);
        if (idx >= 0) s.users[idx] = a.payload;
      })
      .addCase(setUserPermission.rejected, (s, a) => {
        s.updatingIds = s.updatingIds.filter((id) => id !== a.meta.arg.userId);
      });

    builder
      .addCase(setUserAdmin.pending, (s, a) => {
        s.updatingIds.push(a.meta.arg.userId);
      })
      .addCase(setUserAdmin.fulfilled, (s, a) => {
        s.updatingIds = s.updatingIds.filter((id) => id !== a.meta.arg.userId);
        const idx = s.users.findIndex((u) => u.id === a.payload.id);
        if (idx >= 0) s.users[idx] = a.payload;
      })
      .addCase(setUserAdmin.rejected, (s, a) => {
        s.updatingIds = s.updatingIds.filter((id) => id !== a.meta.arg.userId);
      });
  },
});

export default adminUsersSlice.reducer;

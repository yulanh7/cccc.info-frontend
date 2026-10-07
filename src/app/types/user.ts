import { ApiResponseProps } from './api';

export interface UserProps {
  id: number;
  email: string;
  firstName: string;
  admin: boolean;
  permissions?: string[]; // 全局权限，目前只有 'create_group'；admin 隐含拥有全部权限
  created_at?: string; // 新增（可选，对应后端返回）
}

export interface AuthResponseData {
  user: UserProps;
  access_token: string;
  refresh_token: string;
}

export type AuthResponse = ApiResponseProps<AuthResponseData>;

export const isAdmin = (user?: UserProps | null): boolean => !!user?.admin;

/** 全局权限值 */
export const PERMISSION_CREATE_GROUP = 'create_group';
/** 小组管理员：只能授予 admin，admin 也要单独打开 */
export const PERMISSION_MANAGE_GROUPS = 'manage_groups';

/** 小组管理员 = admin 而且打开了 manage_groups；没打开的 admin 在别人的小组里和普通用户一样 */
export const isGroupManager = (user?: UserProps | null): boolean =>
  !!user?.admin && !!user.permissions?.includes(PERMISSION_MANAGE_GROUPS);

/** 能否创建小组：admin 或拥有 create_group 权限（admin 的 permissions 不会自动包含所有值） */
export const canCreateGroup = (user?: UserProps | null): boolean =>
  !!user && (user.admin || !!user.permissions?.includes('create_group'));

/** ===== Profile API types ===== */
export interface ProfileGetData {
  user: UserProps;
}
export type ProfileGetResponse = ApiResponseProps<ProfileGetData>;

export interface ProfileUpdateBody {
  firstName?: string;
  password?: {
    oldPassword: string;
    newPassword: string;
  };
}
export interface ProfileUpdateData {
  user?: UserProps;
}
export type ProfileUpdateResponse = ApiResponseProps<ProfileUpdateData>;

/** ===== Admin 用户权限管理 API types ===== */
export interface AdminUsersListData {
  users: UserProps[];
  pagination: { page: number; per_page: number; total: number; pages: number };
}
export type AdminUsersListResponse = ApiResponseProps<AdminUsersListData>;

export interface UpdateUserPermissionBody {
  permission: string;
  granted: boolean;
}
/** PATCH 成功后 data 直接是更新后的 user */
export type UpdateUserPermissionResponse = ApiResponseProps<UserProps>;

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

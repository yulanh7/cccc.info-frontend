import { ApiResponseProps } from './api';

export interface UserProps {
  id: number;
  email: string;
  firstName: string;
  admin: boolean;
  created_at?: string; // 新增（可选，对应后端返回）
}

export interface AuthResponseData {
  user: UserProps;
  access_token: string;
  refresh_token: string;
}

export type AuthResponse = ApiResponseProps<AuthResponseData>;

export const isAdmin = (user?: UserProps | null): boolean => !!user?.admin;

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

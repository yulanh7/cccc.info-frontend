// /app/features/auth/token.ts
import { UserProps, AuthResponseData } from '@/app/types/user';

export const storeToken = (data: AuthResponseData) => {
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('user', JSON.stringify(data.user));
};

export const setAccessToken = (accessToken: string) => {
  localStorage.setItem('access_token', accessToken);
};

export const getToken = (): string | null => {
  try { return localStorage.getItem('access_token'); } catch { return null; }
};

export const getRefreshToken = (): string | null => {
  try { return localStorage.getItem('refresh_token'); } catch { return null; }
};

export const getUser = (): UserProps | null => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch { return null; }
};

export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const hasToken = (): boolean => !!getToken();

/** 新增：单独更新本地的 user（用于改 firstName 后保持一致） */
export const setUser = (user: UserProps) => {
  localStorage.setItem('user', JSON.stringify(user));
};


import { UserProps, AuthResponseData } from '@/app/types/user';

export const storeToken = (data: AuthResponseData) => {
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('user', JSON.stringify(data.user));
};

export const getToken = (): string | null => {
  try {
    return localStorage.getItem('access_token');
  } catch (error) {
    console.error('Error accessing token:', error);
    return null;
  }
};

export const getRefreshToken = (): string | null => {
  try {

    return localStorage.getItem('refresh_token');
  } catch (error) {
    console.error('Error accessing refresh token:', error);
    return null;
  }
};

export const getUser = (): UserProps | null => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error accessing user:', error);
    return null;
  }
};

export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const hasToken = (): boolean => {
  return !!getToken();
};
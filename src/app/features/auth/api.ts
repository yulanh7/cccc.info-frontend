import apiRequest from '../request';
import { storeToken } from './token';
import { AuthResponse, AuthUserProps } from '@/app/types/user';
import { LoginCredentials, SignupCredentials } from '@/app/types/auth';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiRequest<AuthUserProps>('POST', '/auth/login', credentials, false);
  if (response.data && response.success) {
    storeToken(response.data.token);
  }
  return response;
};

export const signup = async (credentials: SignupCredentials): Promise<AuthResponse> => {
  const response = await apiRequest<AuthUserProps>('POST', '/auth/signup', credentials, false);
  if (response.data && response.success) {
    storeToken(response.data.token);
  }
  return response;
};
import apiRequest from '../request';
import { storeToken } from './token';
import { AuthResponse, AuthResponseData } from '@/app/types/user';
import { LoginCredentials, SignupCredentials } from '@/app/types/auth';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await apiRequest<AuthResponseData>('POST', '/auth/login', credentials, false);
    if (response.success && response.data) {
      storeToken(response.data.access_token, response.data.refresh_token);
    }
    return response;
  } catch (error: any) {
    throw { code: error.code || 500, message: error.message || 'Login failed' };
  }
};

export const signup = async (credentials: SignupCredentials): Promise<AuthResponse> => {
  try {
    const response = await apiRequest<AuthResponseData>('POST', '/auth/signup', credentials, false);
    if (response.success && response.data) {
      storeToken(response.data.access_token, response.data.refresh_token);
    }
    return response;
  } catch (error: any) {
    throw { code: error.code || 500, message: error.message || 'Signup failed' };
  }
};
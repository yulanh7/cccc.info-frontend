import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken } from '@/app/features/auth/token';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  data: T;
  status: number;
}

interface ErrorResponse {
  message: string;
  status: number;
}

const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  requireAuth: boolean = true
): Promise<ApiResponse<T>> => {
  try {
    const config: AxiosRequestConfig = {
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (requireAuth) {
      const token = getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      } else {
        throw new Error('No token found');
      }
    }

    const response: AxiosResponse<T> = await axios(config);

    return {
      data: response.data,
      status: response.status,
    };
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Request failed';
    throw { status, message } as ErrorResponse;
  }
};

export default apiRequest;
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken } from './auth/token';
import { ApiResponseProps } from '@/app/types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ErrorResponse {
  message: string;
  code: number;
}

const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  requireAuth: boolean = true
): Promise<ApiResponseProps<T>> => {
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

    const response: AxiosResponse = await axios(config);

    return {
      success: response.data.success,
      code: response.data.code || 200,
      message: response.data.message,
      data: {
        ...response.data.user,
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      } as T,
    };
  } catch (error: any) {
    const code = error.response?.status || 500;
    let message = error.response?.data?.message || 'Request failed';
    if (error.code === 'ECONNREFUSED') {
      message = `Cannot connect to ${BASE_URL}${endpoint}. Ensure the backend server is running on port 5000.`;
    }
    throw { code, message } as ErrorResponse;
  }
};

export default apiRequest;
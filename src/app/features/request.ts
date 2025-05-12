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

    const response: AxiosResponse<ApiResponseProps<T>> = await axios(config);

    // Validate response structure
    if (response.data === undefined || response.data === null) {
      throw new Error('Invalid API response: Missing data');
    }

    return {
      success: response.data.success ?? true,
      code: response.data.code || response.status,
      message: response.data.message || 'Success',
      data: response.data.data as T,
    };
  } catch (error: any) {
    const code = error.response?.status || 500;
    let message = error.response?.data?.message || `Request failed: ${method} ${endpoint}`;
    if (error.code === 'ECONNREFUSED') {
      message = `Cannot connect to ${BASE_URL}${endpoint}. Ensure the backend server is running.`;
    }
    throw { code, message } as ErrorResponse;
  }
};

export default apiRequest;
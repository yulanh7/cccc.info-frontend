// request.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { ApiResponseProps } from '@/app/types/api';
import {
  getToken,
  getRefreshToken,
  setAccessToken, // Make sure this exists in token.ts
  clearAuth,
} from './auth/token';

// ====== Base configuration ======
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ====== Optional: Callback for when access token is refreshed ======
export let onAccessTokenRefreshed: ((token: string) => void) | null = null;
export const setOnAccessTokenRefreshed = (fn: (token: string) => void) => {
  onAccessTokenRefreshed = fn;
};

// ====== Concurrent 401 queue handling ======
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

// Process all queued requests once refresh is complete
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

// ====== Request interceptor: attach access_token automatically (browser only) ======
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ====== Response interceptor: handle 401 → refresh token → retry ======
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Not a 401 error OR request has already been retried → throw
    if (error.response?.status !== 401 || originalRequest?._retry) {
      throw error;
    }

    // No refresh token → cannot refresh → clear auth
    const refreshToken =
      typeof window !== 'undefined' ? getRefreshToken() : null;
    if (!refreshToken) {
      clearAuth();
      throw error;
    }

    originalRequest._retry = true;

    // If refresh is already in progress, queue the request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: unknown) => {
            if (typeof token === 'string') {
              originalRequest.headers = originalRequest.headers ?? {};
              (originalRequest.headers as any).Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    // Start refresh process
    isRefreshing = true;

    try {
      // Use a clean axios instance to avoid triggering interceptors recursively
      const raw = axios.create({ baseURL: BASE_URL });

      // NOTE: If BASE_URL already includes `/api`, just use `/auth/refresh` here
      const refreshResp: AxiosResponse<{
        success: boolean;
        message: string;
        data: { access_token: string };
      }> = await raw.post(
        '/auth/refresh',
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } }
      );

      const newAccess = refreshResp.data?.data?.access_token;
      if (!newAccess) throw new Error('No access_token in refresh response');

      // Save new access token locally
      if (typeof window !== 'undefined') {
        setAccessToken(newAccess);
      }
      // Notify listeners (e.g., Redux) of the new token
      onAccessTokenRefreshed?.(newAccess);

      // Process queued requests
      processQueue(null, newAccess);

      // Retry original request with the new token
      originalRequest.headers = originalRequest.headers ?? {};
      (originalRequest.headers as any).Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (err) {
      // Refresh failed: clear auth and reject all queued requests
      processQueue(err, null);
      clearAuth();
      throw err;
    } finally {
      isRefreshing = false;
    }
  }
);

// ====== Main API request function: returns ApiResponseProps<T> ======
export const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  requireAuth: boolean = true
): Promise<ApiResponseProps<T>> => {
  try {
    const config: AxiosRequestConfig = {
      method,
      url: endpoint, // Since baseURL is already set
      data,
    };

    // If auth is required but no token is present (browser only)
    if (requireAuth && typeof window !== 'undefined') {
      const token = getToken();
      if (!token) throw new Error('No token found');
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }

    // Tell axios the expected response shape
    const response: AxiosResponse<ApiResponseProps<T>> =
      await api.request<ApiResponseProps<T>>(config);

    const res = response.data;
    if (res == null) throw new Error('Invalid API response: Missing data');

    // Normalize (in case backend omits code/message)
    return {
      success: res.success ?? true,
      code: res.code ?? response.status,
      message: res.message ?? 'Success',
      data: res.data as T,
    };
  } catch (error: any) {
    const code = error.response?.status || 500;
    let message =
      error.response?.data?.message ||
      `Request failed: ${method} ${BASE_URL}${endpoint}`;
    if (error.code === 'ECONNREFUSED') {
      message = `Cannot connect to ${BASE_URL}${endpoint}. Ensure the backend server is running.`;
    }
    throw { code, message } as { code: number; message: string };
  }
};

export default api;

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
  setAccessToken, // 确保在 token.ts 存在
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

// ====== 小工具：统一的登录引导（弹提示 → 跳转 /auth?next=...）======
const promptLoginRedirect = (msg?: string) => {
  if (typeof window === 'undefined') return;

  const next =
    window.location.pathname + window.location.search + window.location.hash;
  const tip = msg ?? '请先登录后再继续操作。现在前往登录页？';

  // 原生 confirm 简单可靠；如果你有自定义 Modal，可以把这里替换成 Modal 逻辑
  const ok = window.confirm(tip);
  if (ok) {
    window.location.href = `/auth?next=${encodeURIComponent(next)}`;
  }
};

function pickServerMessage(payload: any): string | undefined {
  if (!payload) return;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload.message && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  if (payload.error && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  // 常见的校验 errors 结构：数组或 { field: [msg] }
  if (Array.isArray(payload.errors) && payload.errors.length) {
    return payload.errors.map(String).join(", ");
  }
  if (payload.errors && typeof payload.errors === "object") {
    try {
      const flat = Object.values(payload.errors).flat();
      if (Array.isArray(flat) && flat.length) return flat.map(String).join(", ");
    } catch { }
  }
  return;
}


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

    // 非 401 或已经重试过 → 直接抛出
    if (error.response?.status !== 401 || originalRequest?._retry) {
      const serverMsg = pickServerMessage(error.response?.data);
      if (serverMsg) (error as any).message = serverMsg; // 覆盖成后端的人话
      throw error;
    }

    // 没有 refresh token → 无法刷新 → 清理并引导登录
    const refreshToken =
      typeof window !== 'undefined' ? getRefreshToken() : null;
    if (!refreshToken) {
      clearAuth();
      // 友好提示并引导
      promptLoginRedirect('登录已过期或未登录，需要先登录。现在去登录？');
      throw error;
    }

    originalRequest._retry = true;

    // 如果正在刷新，加入队列
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

    // 开始刷新
    isRefreshing = true;

    try {
      // 用干净实例避免递归触发拦截器
      const raw = axios.create({ baseURL: BASE_URL });

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

      // 保存新 access token
      if (typeof window !== 'undefined') {
        setAccessToken(newAccess);
      }
      // 通知监听者（如 Redux）
      onAccessTokenRefreshed?.(newAccess);

      // 处理队列
      processQueue(null, newAccess);

      // 以新 token 重试发起的请求
      originalRequest.headers = originalRequest.headers ?? {};
      (originalRequest.headers as any).Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (err) {
      // 刷新失败：清理、引导登录，并拒绝队列
      processQueue(err, null);
      clearAuth();
      promptLoginRedirect('登录已过期，需要重新登录。现在去登录？');
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
      url: endpoint, // baseURL 已设置
      data,
    };

    // 需要鉴权但没有 token（仅浏览器环境）
    if (requireAuth && typeof window !== 'undefined') {
      const token = getToken();
      if (!token) {
        // 弹提示并引导登录
        promptLoginRedirect('该操作需要登录。现在前往登录页？');
        // 抛一个一致的错误给调用方
        throw { code: 401, message: '未登录或会话已过期' };
      }
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }

    const response: AxiosResponse<ApiResponseProps<T>> =
      await api.request<ApiResponseProps<T>>(config);

    const res = response.data;
    if (res == null) throw new Error('Invalid API response: Missing data');

    return {
      success: res.success ?? true,
      code: res.code ?? response.status,
      message: res.message ?? 'Success',
      data: res.data as T,
    };
  } catch (error: any) {
    const status = error?.response?.status ?? 500;
    const code = typeof status === "number" ? status : 500;
    const serverMsg = pickServerMessage(error?.response?.data);
    let message =
      serverMsg ??
      error?.response?.data?.message ??
      error?.message ??
      `Request failed: ${method} ${BASE_URL}${endpoint}`;
    if (error.code === 'ECONNREFUSED') {
      message = `Cannot connect to ${BASE_URL}${endpoint}. Ensure the backend server is running.`;
    }
    throw { code, message } as { code: number; message: string };
  }
};

export default api;

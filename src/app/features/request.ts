import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

import { ApiResponseProps, ApiResponseRaw } from '@/app/types/api';
import { normalizeApiResponse } from '@/app/lib/api/normalize'
import {
  getToken,
  getRefreshToken,
  setAccessToken, // 确保在 token.ts 存在
  clearAuth,
} from './auth/token';

// ====== Base configuration ======
const BASE_URL = '/api';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ====== Optional: Callback for when access token is refreshed ======
export let onAccessTokenRefreshed: ((token: string) => void) | null = null;
export const setOnAccessTokenRefreshed = (fn: (token: string) => void) => {
  onAccessTokenRefreshed = fn;
};

// ====== 新增：全局 5xx 错误广播（事件 + 订阅）======
export type ServerErrorInfo = {
  code: number;
  message: string;
  method?: string;
  url?: string;
};

let serverErrorListeners: Array<(info: ServerErrorInfo) => void> = [];

export const subscribeServerError = (fn: (info: ServerErrorInfo) => void) => {
  serverErrorListeners.push(fn);
  return () => {
    serverErrorListeners = serverErrorListeners.filter((f) => f !== fn);
  };
};

const notifyServerError = (info: ServerErrorInfo) => {
  // DOM 事件（更通用，无需导入）
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('global-http-5xx', { detail: info }));
    } catch { }
  }
  // 订阅回调（可选）
  serverErrorListeners.forEach((fn) => {
    try { fn(info); } catch { }
  });
};

// ====== 小工具：统一的登录引导（弹提示 → 跳转 /auth?next=...）======
const promptLoginRedirect = (msg?: string) => {
  if (typeof window === 'undefined') return;

  const next =
    window.location.pathname + window.location.search + window.location.hash;
  const tip = msg ?? '请先登录后再继续操作。现在前往登录页？';

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
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // ✨ 鉴权端点检测（保持你的逻辑不变）
    const url = (originalRequest?.url || '') as string;
    const isAuthEndpoint =
      typeof url === 'string' &&
      /^\/?auth\/(login|signup|refresh|logout)/i.test(url);

    const status = error.response?.status;

    // 非 401 或已重试 或 鉴权端点 → 直接抛出（并在 5xx 时广播事件）
    if (status !== 401 || originalRequest?._retry || isAuthEndpoint) {
      const serverMsg = pickServerMessage(error.response?.data);
      if (serverMsg) (error as any).message = serverMsg;

      // 🔔 新增：5xx 全局广播
      if (typeof status === 'number' && status >= 500) {
        notifyServerError({
          code: status,
          message: serverMsg || error.message || 'Server Error',
          method: (originalRequest?.method || 'GET').toUpperCase(),
          url: originalRequest?.url || '',
        });
      }

      throw error;
    }

    // ↓↓↓ 以下保持你的原逻辑不变 ↓↓↓
    const refreshToken = typeof window !== 'undefined' ? getRefreshToken() : null;
    if (!refreshToken) {
      clearAuth();
      promptLoginRedirect('登录已过期或未登录，需要先登录。现在去登录？');
      throw error;
    }

    originalRequest._retry = true;

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

    isRefreshing = true;

    try {
      const raw = axios.create({ baseURL: BASE_URL });
      const refreshResp = await raw.post('/auth/refresh', {}, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      });

      const newAccess = refreshResp.data?.data?.access_token;
      if (!newAccess) throw new Error('No access_token in refresh response');

      if (typeof window !== 'undefined') setAccessToken(newAccess);
      onAccessTokenRefreshed?.(newAccess);
      processQueue(null, newAccess);

      originalRequest.headers = originalRequest.headers ?? {};
      (originalRequest.headers as any).Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (err) {
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
    const config: AxiosRequestConfig = { method, url: endpoint, data };

    if (requireAuth && typeof window === 'undefined') {
      // SSR 环境不做本地 token 注入
    }

    if (requireAuth && typeof window !== 'undefined') {
      const token = getToken();
      if (!token) {
        promptLoginRedirect('该操作需要登录。现在前往登录页？');
        throw { code: 401, message: '未登录或会话已过期' };
      }
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
    }

    const response: AxiosResponse<ApiResponseRaw<T>> =
      await api.request<ApiResponseRaw<T>>(config);

    return normalizeApiResponse<T>(response.data, response.status);

  } catch (error: any) {
    const status = error?.response?.status ?? 500;
    const code = typeof status === 'number' ? status : 500;
    const serverMsg = pickServerMessage(error?.response?.data);
    let message =
      serverMsg ??
      error?.response?.data?.message ??
      error?.message ??
      `Request failed: ${method} ${BASE_URL}${endpoint}`;
    if (error.code === 'ECONNREFUSED') {
      message = `Cannot connect to ${BASE_URL}${endpoint}. Ensure the backend server is running.`;
    }

    // 控制台便捷日志
    try {
      // eslint-disable-next-line no-console
      console.error(
        '[API ERROR]',
        method,
        endpoint,
        code,
        error?.response?.data || message
      );
    } catch { }

    // 🔔 新增：5xx 全局广播
    if (code >= 500) {
      notifyServerError({
        code,
        message,
        method,
        url: endpoint,
      });
    }

    throw { code, message } as { code: number; message: string };
  }
};

export default api;

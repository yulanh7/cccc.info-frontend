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
import {
  getLibraryAccessCode,
  clearLibraryAccessCode,
  needsLibraryAccessHeader,
  LIBRARY_ACCESS_HEADER,
} from './library/access';

// ====== Base configuration ======
/** 后端错误响应的 body（只读用得到的字段） */
type ServerErrorBody = { message?: string; code?: string; [key: string]: unknown };

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://localhost:5000') + '/api'

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
/** 已经在跳去登录页（例如帐号被停用）：其他请求不要再弹“需要登录”的确认框 */
let redirectingToAuth = false;

const promptLoginRedirect = (msg?: string) => {
  if (typeof window === 'undefined' || redirectingToAuth) return;

  const next =
    window.location.pathname + window.location.search + window.location.hash;
  const tip = msg ?? 'Please log in to continue. Go to the login page now?';

  const ok = window.confirm(tip);
  if (ok) {
    window.location.href = `/auth?next=${encodeURIComponent(next)}`;
  }
};

// ====== 帐号被 admin 停用：已登录的设备任何请求（包括刷新 token）都会 401 + ACCOUNT_DEACTIVATED ======
/** 登录页显示一次的提示（例如帐号已停用） */
export const AUTH_NOTICE_KEY = 'authNotice';
const ACCOUNT_DEACTIVATED = 'ACCOUNT_DEACTIVATED';

const isDeactivated = (status: number | undefined, payload: any) =>
  (status === 401 || status === 403) && payload?.code === ACCOUNT_DEACTIVATED;

/** 统一登出并回到登录页，登录页显示后端的原因 */
function handleDeactivated(payload: any) {
  if (typeof window === 'undefined') return;
  clearAuth();
  redirectingToAuth = true;
  try {
    sessionStorage.setItem(AUTH_NOTICE_KEY, pickServerMessage(payload) || 'This account has been deactivated.');
  } catch {
    /* 忽略 */
  }
  if (!window.location.pathname.startsWith('/auth')) window.location.href = '/auth';
}

// ====== 带固定 code 的 403：必须先改密码 / 没有通过链接进入图书馆 ======
export const CHANGE_PASSWORD_PATH = '/change-password';
export const LIBRARY_ACCESS_EVENT = 'library-access-required';

function handleBlockingErrorCode(status: number | undefined, payload: any) {
  if (typeof window === 'undefined' || status !== 403) return;
  const code = payload?.code;
  if (code === 'PASSWORD_CHANGE_REQUIRED') {
    // 任何接口被挡住都去改密码页（已经在那一页就不动）
    if (window.location.pathname !== CHANGE_PASSWORD_PATH) window.location.href = CHANGE_PASSWORD_PATH;
  } else if (code === 'LIBRARY_ACCESS_REQUIRED') {
    // 链接被关闭 / 重新生成，或者没有访问码：清掉，图书馆页面监听这个事件显示提示
    clearLibraryAccessCode();
    window.dispatchEvent(new CustomEvent(LIBRARY_ACCESS_EVENT, { detail: pickServerMessage(payload) }));
  }
}

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
    // 图书馆接口带上通过链接 / 二维码拿到的访问码（图书管理员不需要，带了也无妨）
    const libraryCode = getLibraryAccessCode();
    if (libraryCode && needsLibraryAccessHeader(String(config.url || ''))) {
      config.headers = config.headers ?? {};
      (config.headers as any)[LIBRARY_ACCESS_HEADER] = libraryCode;
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

    // 帐号已停用：不要再刷新 token（也会被拒绝），直接登出。登录本身被拒（403）由登录表单显示原因
    const isLogin = /^\/?auth\/login/i.test(url);
    if (!isLogin && isDeactivated(status, error.response?.data)) {
      const serverMsg = pickServerMessage(error.response?.data);
      if (serverMsg) (error as any).message = serverMsg;
      handleDeactivated(error.response?.data);
      throw error;
    }

    // 非 401 或已重试 或 鉴权端点 → 直接抛出（并在 5xx 时广播事件）
    if (error.response?.status !== 401 || originalRequest?._retry || isAuthEndpoint) {
      const serverMsg = pickServerMessage(error.response?.data);
      if (serverMsg) (error as any).message = serverMsg;
      handleBlockingErrorCode(error.response?.status, error.response?.data);



      throw error;
    }

    // ↓↓↓ 以下保持你的原逻辑不变 ↓↓↓
    const refreshToken = typeof window !== 'undefined' ? getRefreshToken() : null;
    if (!refreshToken) {
      clearAuth();
      promptLoginRedirect('You are not logged in or your session has expired. Log in now?');
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
      const refreshErr = err as AxiosError<any>;
      if (isDeactivated(refreshErr.response?.status, refreshErr.response?.data)) {
        handleDeactivated(refreshErr.response?.data);
        throw err;
      }
      clearAuth();
      promptLoginRedirect('Your session has expired. Log in again now?');
      throw err;
    } finally {
      isRefreshing = false;
    }
  }
);


// ====== Main API request function: returns ApiResponseProps<T> ======
export const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any,
  requireAuth: boolean = true
): Promise<ApiResponseProps<T>> => {
  try {
    const config: AxiosRequestConfig = { method, url: endpoint, data };



    if (requireAuth && typeof window !== 'undefined') {
      const token = getToken();
      if (!token) {
        promptLoginRedirect('You need to log in to do this. Go to the login page now?');
        throw { code: 401, message: 'Not logged in or session expired' };
      }
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
    }

    const response: AxiosResponse<ApiResponseRaw<T>> =
      await api.request<ApiResponseRaw<T>>(config);

    return normalizeApiResponse<T>(response.data, response.status);

  } catch (caught) {
    // 这里只会收到 axios 的错误（或网络错误），按它的形状读
    const error = caught as Partial<AxiosError<ServerErrorBody>>;
    const status = error?.response?.status ?? 500;
    const code = typeof status === 'number' ? status : 500;
    const serverMsg = pickServerMessage(error?.response?.data);
    let message =
      serverMsg ??
      error?.response?.data?.message ??
      error?.message ??
      `Request failed: ${method} ${BASE_URL}${endpoint}`;
    if (error?.code === 'ECONNREFUSED') {
      message = `Cannot connect to ${BASE_URL}${endpoint}. Ensure the backend server is running.`;
    }


    // errorCode：后端的固定 code（如 PASSWORD_CHANGE_REQUIRED、LIBRARY_ACCESS_REQUIRED）
    const errorCode = error?.response?.data?.code as string | undefined;
    throw { code, message, errorCode } as { code: number; message: string; errorCode?: string };
  }
};

export default api;

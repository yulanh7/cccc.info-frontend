// src/lib/api/client.ts

import { ApiResponse, ApiError, RequestConfig } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export class ApiClient {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    /**
     * 获取存储的访问令牌
     */
    getAccessToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('access_token');
    }

    /**
     * 获取存储的刷新令牌
     */
    getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('refresh_token');
    }

    /**
     * 设置访问令牌
     */
    setAccessToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', token);
        }
    }

    /**
     * 设置刷新令牌
     */
    setRefreshToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('refresh_token', token);
        }
    }

    /**
     * 清除所有令牌
     */
    clearTokens(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    }

    /**
     * 发送 HTTP 请求
     */
    async request<T>(
        endpoint: string,
        config: RequestConfig = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const defaultHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // 添加认证令牌
        const token = this.getAccessToken();
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const requestConfig: RequestInit = {
            ...config,
            headers: {
                ...defaultHeaders,
                ...config.headers,
            },
        };

        try {
            const response = await fetch(url, requestConfig);
            const data = await response.json();

            // 如果是 401 错误且有刷新令牌，尝试刷新访问令牌
            if (response.status === 401 && this.getRefreshToken() && !endpoint.includes('/refresh')) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // 重试原请求
                    const newToken = this.getAccessToken();
                    if (newToken) {
                        requestConfig.headers = {
                            ...requestConfig.headers,
                            'Authorization': `Bearer ${newToken}`,
                        };
                        const retryResponse = await fetch(url, requestConfig);
                        return await retryResponse.json();
                    }
                }
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw new ApiError({
                message: error instanceof Error ? error.message : 'Network error occurred',
                status: 0,
            });
        }
    }

    /**
     * 刷新访问令牌
     */
    private async refreshAccessToken(): Promise<boolean> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshToken}`,
                },
            });

            const data = await response.json();

            if (data.success && data.access_token) {
                this.setAccessToken(data.access_token);
                return true;
            } else {
                this.clearTokens();
                return false;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearTokens();
            return false;
        }
    }

    /**
     * GET 请求
     */
    async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { ...config, method: 'GET' });
    }

    /**
     * POST 请求
     */
    async post<T>(
        endpoint: string,
        data?: any,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * PUT 请求
     */
    async put<T>(
        endpoint: string,
        data?: any,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * DELETE 请求
     */
    async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { ...config, method: 'DELETE' });
    }
}

// 创建默认客户端实例
export const apiClient = new ApiClient();
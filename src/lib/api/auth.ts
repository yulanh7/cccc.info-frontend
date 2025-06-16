// src/lib/api/auth.ts

import { apiClient } from './client';
import {
    ApiResponse,
    LoginRequest,
    SignupRequest,
    AuthResponse,
    RefreshTokenResponse,
    User,
} from './types';

export class AuthApi {
    /**
     * 用户登录
     */
    async login(
        email: string,
        password: string,
        recaptchaToken: string
    ): Promise<ApiResponse<AuthResponse>> {
        const loginData: LoginRequest = {
            email,
            password,
            recaptchaToken,
        };

        const response = await apiClient.post<AuthResponse>('/api/auth/login', loginData);

        // 如果登录成功，存储令牌
        if (response.success && response.data) {
            apiClient.setAccessToken(response.data.access_token);
            apiClient.setRefreshToken(response.data.refresh_token);
        }

        return response;
    }

    /**
     * 用户注册
     */
    async signup(
        email: string,
        firstName: string,
        password: string,
        recaptchaToken: string
    ): Promise<ApiResponse<AuthResponse>> {
        const signupData: SignupRequest = {
            email,
            firstName,
            password,
            recaptchaToken,
        };

        const response = await apiClient.post<AuthResponse>('/api/auth/signup', signupData);

        // 如果注册成功，存储令牌
        if (response.success && response.data) {
            apiClient.setAccessToken(response.data.access_token);
            apiClient.setRefreshToken(response.data.refresh_token);
        }

        return response;
    }

    /**
     * 用户登出
     */
    async logout(): Promise<ApiResponse<void>> {
        try {
            const response = await apiClient.post<void>('/api/auth/logout');
            // 无论 API 调用是否成功，都清除本地令牌
            apiClient.clearTokens();
            return response;
        } catch (error) {
            // 即使 API 调用失败，也要清除本地令牌
            apiClient.clearTokens();
            throw error;
        }
    }

    /**
     * 获取当前用户信息
     */
    async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
        return apiClient.get<{ user: User }>('/api/auth/user');
    }

    /**
     * 刷新访问令牌
     */
    async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
        const refreshToken = apiClient.getRefreshToken();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await apiClient.post<RefreshTokenResponse>(
            '/api/auth/refresh',
            {},
            {
                headers: {
                    'Authorization': `Bearer ${refreshToken}`,
                },
            }
        );

        // 如果刷新成功，更新访问令牌
        if (response.success && response.data) {
            apiClient.setAccessToken(response.data.access_token);
        }

        return response;
    }

    /**
     * 检查用户是否已登录
     */
    isLoggedIn(): boolean {
        return !!apiClient.getAccessToken();
    }

    /**
     * 获取当前访问令牌
     */
    getAccessToken(): string | null {
        return apiClient.getAccessToken();
    }

    /**
     * 获取当前刷新令牌
     */
    getRefreshToken(): string | null {
        return apiClient.getRefreshToken();
    }
}

// 创建认证 API 实例
export const authApi = new AuthApi();
// src/lib/api/types.ts

// 基础 API 响应类型
export interface ApiResponse<T = never> {
    success: boolean;
    message?: string;
    data?: T;
    code?: number;
}

// 用户相关类型
export interface User {
    id: number;
    email: string;
    firstName: string;
    admin: boolean;
}

// 认证相关类型
export interface LoginRequest {
    email: string;
    password: string;
    recaptchaToken: string;
    clientHash?: boolean;
}

export interface SignupRequest {
    email: string;
    firstName: string;
    password: string;
    recaptchaToken: string;
    clientHash?: boolean;
}

export interface AuthResponse {
    user: User;
    access_token: string;
    refresh_token: string;
}

export interface RefreshTokenResponse {
    access_token: string;
}

// HTTP 客户端配置类型
export interface RequestConfig extends RequestInit {
    headers?: Record<string, string>;
}

// 错误类型
export class ApiError extends Error {
    public status?: number;
    public code?: number;

    constructor({ message, status, code }: { message: string; status?: number; code?: number }) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }
}
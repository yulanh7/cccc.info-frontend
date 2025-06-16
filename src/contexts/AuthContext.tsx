// src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import { User } from '@/lib/api/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string, recaptchaToken: string) => Promise<boolean>;
    signup: (email: string, firstName: string, password: string, recaptchaToken: string) => Promise<boolean>;
    logout: () => Promise<void>;
    error: string | null;
    clearError: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 检查用户是否已登录
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        if (!authApi.isLoggedIn()) {
            setLoading(false);
            return;
        }

        try {
            const response = await authApi.getCurrentUser();
            if (response.success && response.data) {
                setUser(response.data.user);
            } else {
                // Token 可能已过期，清除并重新登录
                await authApi.logout();
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            await authApi.logout();
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string, recaptchaToken: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const response = await authApi.login(email, password, recaptchaToken);

            if (response.success && response.data) {
                setUser(response.data.user);
                return true;
            } else {
                setError(response.message || 'Login failed');
                return false;
            }
        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message || 'Network error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (
        email: string,
        firstName: string,
        password: string,
        recaptchaToken: string
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const response = await authApi.signup(email, firstName, password, recaptchaToken);

            if (response.success && response.data) {
                setUser(response.data.user);
                return true;
            } else {
                setError(response.message || 'Signup failed');
                return false;
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            setError(error.message || 'Network error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
        }
    };

    const clearError = () => {
        setError(null);
    };

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        error,
        clearError,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
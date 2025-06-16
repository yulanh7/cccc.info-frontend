// src/components/LoginForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, error, clearError, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=6LeVQAIrAAAAAG_UnrI3up7fDN2muaqOtmfIhYv0';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute('6LeVQAIrAAAAAG_UnrI3up7fDN2muaqOtmfIhYv0', { action: 'login' })
          .then((token: string) => setRecaptchaToken(token));
      });
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // 清除错误当组件卸载时
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recaptchaToken) {
      alert('reCAPTCHA 未加载，请稍后再试');
      return;
    }

    if (!email || !password) {
      alert('请填写所有字段');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const success = await login(email, password, recaptchaToken);
      
      if (success) {
        // 登录成功，重定向到主页
        router.push('/');
      }
      // 如果失败，错误信息会通过 context 显示
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-dark-green"
        required
        disabled={isSubmitting || loading}
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-2 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-dark-green"
        required
        disabled={isSubmitting || loading}
      />
      
      <button
        type="submit"
        className="w-full p-2 bg-dark-green text-white rounded-sm hover:bg-green disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        disabled={isSubmitting || loading || !recaptchaToken}
      >
        {isSubmitting || loading ? '登录中...' : 'Login'}
      </button>
    </form>
  );
}
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginThunk } from '@/app/features/auth/slice';
import { LoginCredentials } from '@/app/types/auth';
import { AppDispatch } from '@/app/features/store';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=6LeVQAIrAAAAAG_UnrI3up7fDN2muaqOtmfIhYv0';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute('6LeVQAIrAAAAAG_UnrI3up7fDN2muaqOtmfIhYv0', { action: 'login' })
          .then((token: string) => setRecaptchaToken(token))
          .catch((err: any) => {
            console.error('reCAPTCHA error:', err);
            setError('无法加载 reCAPTCHA，请稍后重试');
          });
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaToken) {
      setError('reCAPTCHA 未加载，请稍后重试');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const credentials: LoginCredentials = {
        email,
        password,
        // recaptchaToken, // Remove if not required by backend
      };
      await dispatch(loginThunk(credentials)).unwrap();
      router.push('/');
    } catch (err: any) {
      setError(err || '登录失败，请检查您的邮箱或密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 border border-border rounded-sm"
        required
        disabled={isLoading}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-2 border border-border rounded-sm"
        required
        disabled={isLoading}
      />
      <button
        type="submit"
        className="w-full p-2 bg-dark-green text-white rounded-sm hover:bg-green disabled:bg-gray-400"
        disabled={isLoading}
      >
        {isLoading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
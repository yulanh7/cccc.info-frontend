"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginThunk } from '@/app/features/auth/slice';
import { LoginCredentials } from '@/app/types/auth';
import { AppDispatch } from '@/app/features/store';
import { getRecaptchaToken } from '@/app/ultility/recaptcha';
import Button from '@/components/ui/Button'; // ← 按你的路径修改
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPsw, setShowPsw] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const recaptchaToken = await getRecaptchaToken('login').catch(() => null);

      const credentials: LoginCredentials = {
        email,
        password,
        ...(recaptchaToken ? { recaptchaToken } : {}),
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
      <div className="relative">
        <input
          type={showPsw ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Confirm Password"
          className="w-full p-2 border border-border rounded-sm"
          required
          disabled={isLoading}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10"
          onClick={() => setShowPsw((v) => !v)}
          aria-label={showPsw ? 'Hide password' : 'Show password'}
        >
          {showPsw ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      </div>
      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        loading={isLoading}
        loadingText="登录中..."
        blockWhileLoading
        aria-label="登录"
      >
        登录
      </Button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/features/hooks';
import { signupThunk } from '@/app/features/auth/slice';
import { getRecaptchaToken } from '@/app/ultility/recaptcha';
import Button from '@/components/ui/Button'; // ← 按你的路径修改

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { status, error } = useAppSelector((state) => state.auth);
  const isLoading = status === 'loading';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (password !== confirmPassword) {
      alert('密码不匹配');
      return;
    }

    const recaptchaToken = await getRecaptchaToken('signup').catch(() => null);

    const result = await dispatch(
      signupThunk({
        email,
        firstName,
        password,
        ...(recaptchaToken ? { recaptchaToken } : {}),
      })
    );

    if (signupThunk.fulfilled.match(result)) {
      alert(`${firstName} 注册成功`);
      router.push('/groups');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
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
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First Name"
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
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm Password"
        className="w-full p-2 border border-border rounded-sm"
        required
        disabled={isLoading}
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        loading={isLoading}
        loadingText="Signing up..."
        blockWhileLoading
        aria-label="Sign up"
      >
        Sign Up
      </Button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  );
}

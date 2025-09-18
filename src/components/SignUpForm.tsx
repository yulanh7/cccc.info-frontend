'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/features/hooks';
import { signupThunk } from '@/app/features/auth/slice';
import { getRecaptchaToken, initRecaptcha } from '@/app/ultility/recaptcha';
import Button from '@/components/ui/Button';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { FIRST_NAME_RULE, FIRST_NAME_ERR } from '@/app/constants'

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { status, error } = useAppSelector((state) => state.auth);
  const isLoading = status === 'loading';

  // 2-20 位：英文/数字/下划线/中文；不允许空格
  const invalidName = submitted && !FIRST_NAME_RULE.test(firstName);

  useEffect(() => { initRecaptcha(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setSubmitted(true);

    // 名字校验（长度与字符集一次完成）
    if (!FIRST_NAME_RULE.test(firstName)) {
      const el = document.getElementById('first-name-input') as HTMLInputElement | null;
      el?.focus();
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords don’t match.');
      return;
    }

    const recaptchaToken = await getRecaptchaToken('signup').catch(() => null);

    // 替换原来的：const result = await dispatch(signupThunk(...)); if (signupThunk.fulfilled.match(result)) { ... }

    try {
      await dispatch(
        signupThunk({
          email,
          firstName, // 已经在前面通过正则校验
          password,
          ...(recaptchaToken ? { recaptchaToken } : {}),
        })
      ).unwrap(); // <-- 关键

      alert(`${firstName} 注册成功`);
      router.push('/groups');
    } catch (e: any) {
      // e 会是 rejectWithValue(...) 的字符串/对象，或 Error
      const msg =
        typeof e === 'string'
          ? e
          : e?.message || 'Signup failed';
      alert(msg);
    }

  };

  const describedBy = `first-name-help${invalidName ? ' first-name-error' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
      {/* Email */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 border border-border rounded-sm"
        required
        disabled={isLoading}
        autoComplete="email"
      />

      {/* First Name */}
      <div>
        <input
          id="first-name-input"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          aria-invalid={invalidName}
          aria-describedby={describedBy}
          className={`w-full p-2 border rounded-sm ${invalidName ? 'border-red-500' : 'border-border'}`}
          disabled={isLoading}
          autoComplete="given-name"
        />

        {/* 统一错误提示（仅提交后显示） */}
        {invalidName && (
          <p id="first-name-error" className="text-red-600 text-sm mt-1">
            {FIRST_NAME_ERR}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="relative">
        <input
          type={showNew ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 border border-border rounded-sm"
          required
          disabled={isLoading}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10"
          onClick={() => setShowNew((v) => !v)}
          aria-label={showNew ? 'Hide password' : 'Show password'}
        >
          {showNew ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Confirm Password */}
      <div className="relative">
        <input
          type={showConfirm ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          className="w-full p-2 border border-border rounded-sm"
          required
          disabled={isLoading}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10"
          onClick={() => setShowConfirm((v) => !v)}
          aria-label={showConfirm ? 'Hide password' : 'Show password'}
        >
          {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        loading={isLoading}
        loadingText="Signing up..."
        blockWhileLoading
        aria-label="Sign up"
        disabled={isLoading}
      >
        Sign Up
      </Button>
    </form>
  );
}

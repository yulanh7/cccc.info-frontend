'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/features/hooks';
import { signupThunk } from '@/app/features/auth/slice';
import { getRecaptchaToken, initRecaptcha } from '@/app/ultility/recaptcha';
import Button from '@/components/ui/Button';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const MIN_FIRST = 2;
const MAX_FIRST = 30;

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 用于控制提示时机
  const [firstTouched, setFirstTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { status, error } = useAppSelector((state) => state.auth);
  const isLoading = status === 'loading';

  const nameTrimmed = useMemo(() => firstName.trim(), [firstName]);
  const nameLen = [...nameTrimmed].length; // 兼容中英文字符
  const nameTooShort = nameLen > 0 && nameLen < MIN_FIRST;
  const nameTooLong = nameLen > MAX_FIRST;
  const nameMissingOnSubmit = submitted && nameLen === 0;

  const showNameInvalid =
    (firstTouched && (nameTooShort || nameTooLong)) || nameMissingOnSubmit;

  useEffect(() => { initRecaptcha(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setSubmitted(true); // 第一次提交后，空值要开始提示

    // 先做名字校验（避免未触碰也报错）
    if (nameMissingOnSubmit || nameTooShort || nameTooLong) {
      const el = document.getElementById('first-name-input') as HTMLInputElement | null;
      el?.focus();
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords don’t match.');
      return;
    }

    const recaptchaToken = await getRecaptchaToken('signup').catch(() => null);

    const result = await dispatch(
      signupThunk({
        email,
        firstName: nameTrimmed.replace(/\s+/g, ' '), // 规范空白
        password,
        ...(recaptchaToken ? { recaptchaToken } : {}),
      })
    );

    if (signupThunk.fulfilled.match(result)) {
      alert(`${nameTrimmed} 注册成功`);
      router.push('/groups');
    }
  };

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

      {/* First Name：进入页面不红；输入后/提交空才提示 */}
      <div>
        <input
          id="first-name-input"
          type="text"
          value={firstName}
          onChange={(e) => {
            if (!firstTouched) setFirstTouched(true);
            setFirstName(e.target.value);
          }}
          onBlur={() => setFirstTouched(true)}
          placeholder="First Name"
          aria-invalid={showNameInvalid}
          aria-describedby="first-name-help first-name-error"
          className={`w-full p-2 border rounded-sm ${showNameInvalid ? 'border-red-500' : 'border-border'}`}
          // 不用 required，由我们自定义“提交时空值才提示”的时机
          disabled={isLoading}
          autoComplete="given-name"
        />

        {/* 计数器：仅在越界或提交空时变红 */}
        <div
          id="first-name-help"
          className={`text-xs mt-1 ${(nameTooShort || nameTooLong || nameMissingOnSubmit) ? 'text-red-600' : 'text-dark-gray'}`}
        >
          {nameLen}/{MAX_FIRST} (min {MIN_FIRST})
        </div>

        {/* 文字错误提示：只在需要时显示 */}
        {showNameInvalid && (
          <p id="first-name-error" className="text-red-600 text-sm mt-1">
            {nameMissingOnSubmit
              ? 'First name is required.'
              : nameTooShort
                ? `First name must be at least ${MIN_FIRST} characters.`
                : `First name cannot exceed ${MAX_FIRST} characters.`}
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
        // 不因名字为空禁用，让用户可点击后再提示
        disabled={isLoading}
      >
        Sign Up
      </Button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  );
}

"use client";

import { useState, useCallback } from 'react';
import Image from 'next/image';
import LoginForm from '@/components/LoginForm';
import SignUpForm from '@/components/SignUpForm';
import ConfirmModal from '@/components/ConfirmModal';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);

  const openForgot = useCallback(() => setForgotOpen(true), []);
  const closeForgot = useCallback(() => setForgotOpen(false), []);

  const handleForgotConfirm = useCallback(() => {
    // 组装 mailto：收件人 + 主题 + 正文模板
    const to = "yulanh7@gmail.com";
    const subject = encodeURIComponent("Password reset request");
    const body = encodeURIComponent(
      `Hi Admin,

I would like to reset my password.

Registered email: (please fill in your registered email here)

Thanks.`
    );
    // 打开系统默认邮件客户端
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setForgotOpen(false);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center -mb-30 -mt-16 md:mt-0">
      <div className="p-6 rounded-sm shadow-lg">
        <div className="flex flex-col items-center justify-center mb-6">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={0}
            height={30}
            className="h-[40px] w-auto md:h-[50px] lg:h-[60px]"
            sizes="(max-width: 767px) 40px, (max-width: 1023px) 80px, 120px"
            priority
          />
          <h1 className="text-lg md:text-xl font-semibold">
            Canberra Chinese Christian Chur Info
          </h1>
        </div>

        {isLogin ? <LoginForm /> : <SignUpForm />}

        <div className="mt-4 flex flex-col items-center gap-2">
          {/* Forgot password */}
          <button
            onClick={openForgot}
            className="text-dark-green hover:underline px-4"
          >
            Forgot password?
          </button>

          {/* 切换登录/注册 */}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-dark-green hover:underline px-4"
          >
            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
          </button>
        </div>
      </div>

      {/* Modal：提示联系管理员并提供注册邮箱 */}
      <ConfirmModal
        isOpen={forgotOpen}
        onCancel={closeForgot}
        onConfirm={handleForgotConfirm}
        message={
          "Forgot your password?\n\nPlease contact the administrator (yulanh7@gmail.com).\nWhen you email us, include the email address you used to register."
        }
        confirmLabel="Email admin"
        cancelLabel="Close"
        confirmVariant="primary"
        cancelVariant="ghost"
      />
    </div>
  );
}

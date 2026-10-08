"use client";

import { useState, useCallback, useEffect } from 'react';
import { AUTH_NOTICE_KEY } from '@/app/features/request';
import Image from 'next/image';
import LoginForm from '@/components/LoginForm';
import SignUpForm from '@/components/SignUpForm';
import ConfirmModal from '@/components/ConfirmModal';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  // 被登出的原因（例如帐号已停用），只显示一次
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    try {
      const n = sessionStorage.getItem(AUTH_NOTICE_KEY);
      if (n) {
        setNotice(n);
        sessionStorage.removeItem(AUTH_NOTICE_KEY);
      }
    } catch {
      /* 忽略 */
    }
  }, []);

  const openForgot = useCallback(() => setForgotOpen(true), []);
  const closeForgot = useCallback(() => setForgotOpen(false), []);

  const handleForgotConfirm = useCallback(() => {
    // 组装 mailto：收件人 + 主题 + 正文模板
    const to = "rachelyl717@gmail.com";
    const subject = encodeURIComponent("CCCC.info Password reset request");
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
          {/* 手机上置中、固定分成两行；sm 以上一行 */}
          <h1 className="text-center text-lg md:text-xl font-semibold">
            <span className="block sm:inline">Canberra Chinese</span>{" "}
            <span className="block sm:inline">Christian Church Info</span>
          </h1>
        </div>

        {notice && (
          <p className="mb-4 rounded-sm border border-red-300 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {notice}
          </p>
        )}

        {isLogin ? <LoginForm /> : <SignUpForm />}

        {/* 分隔区域 + 两个不同层级的链接 */}
        <div className="mt-6 w-full border-t border-border pt-4">
          <div
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            role="group"
            aria-label="Auth actions"
          >
            {/* 次要动作：忘记密码（灰色、虚线下划线、小字） */}
            <button
              onClick={openForgot}
              className="px-2 py-1 text-xs text-gray-500 hover:text-dark-green underline underline-offset-4 decoration-dotted hover:decoration-solid rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border"
            >
              Forgot password?
            </button>

            {/* 主要动作：注册/登录（品牌色、加粗、可点击区域更大） */}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="px-3 py-1 text-sm font-semibold text-dark-green  bg-green/10 hover:bg-green/20 rounded-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border"
            >
              {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
            </button>
          </div>
        </div>

      </div>

      {/* Modal：提示联系管理员并提供注册邮箱 */}
      <ConfirmModal
        isOpen={forgotOpen}
        onCancel={closeForgot}
        onConfirm={handleForgotConfirm}
        message={
          "Forgot your password?\n\nPlease contact the administrator (rachelyl717@gmail.com).\nWhen you email us, include the email address you used to register."
        }
        confirmLabel="Email admin"
        cancelLabel="Close"
        confirmVariant="primary"
        cancelVariant="ghost"
      />
    </div>
  );
}

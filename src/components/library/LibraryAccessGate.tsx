"use client";

import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/app/features/hooks";
import { canManageLibrary } from "@/app/types/library";
import { LIBRARY_ACCESS_EVENT } from "@/app/features/request";
import { getLibraryAccessCode, LIBRARY_ACCESS_REQUIRED_TEXT } from "@/app/features/library/access";
import CustomHeader from "@/components/layout/CustomHeader";
import PageTitle from "@/components/layout/PageTitle";

/**
 * 普通用户必须先通过图书馆链接 / 二维码进入（访问码存在 sessionStorage）。
 * 图书管理员不受限制。接口返回 LIBRARY_ACCESS_REQUIRED 时（链接被关闭 / 重新生成）也切换成提示。
 */
export default function LibraryAccessGate({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  const [mounted, setMounted] = useState(false);
  const [blockedText, setBlockedText] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onBlocked = (e: Event) => setBlockedText((e as CustomEvent<string>).detail || LIBRARY_ACCESS_REQUIRED_TEXT);
    window.addEventListener(LIBRARY_ACCESS_EVENT, onBlocked);
    return () => window.removeEventListener(LIBRARY_ACCESS_EVENT, onBlocked);
  }, []);

  if (!mounted || !user) return null; // 登录守卫会处理未登录
  const isManager = canManageLibrary(user);
  const hasCode = !!getLibraryAccessCode();

  if (!isManager && (blockedText || !hasCode)) {
    return (
      <>
        <CustomHeader pageTitle="Library" showLogo={true} />
        <PageTitle title="Library" showPageTitle />
        <div className="mx-auto w-full max-w-md p-4 min-h-screen mt-0 md:mt-16">
          <p className="rounded-md border border-border bg-white p-4 text-sm text-dark-gray" role="status">
            {blockedText || LIBRARY_ACCESS_REQUIRED_TEXT}. Ask a library manager if you don&apos;t have it.
          </p>
        </div>
      </>
    );
  }
  return <>{children}</>;
}

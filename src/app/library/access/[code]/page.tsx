"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { verifyLibraryAccess } from "@/app/features/library/slice";
import { setLibraryAccessCode, clearLibraryAccessCode } from "@/app/features/library/access";
import CustomHeader from "@/components/layout/CustomHeader";
import PageTitle from "@/components/layout/PageTitle";
import { errorMessage } from "@/app/lib/errors";

/** 扫二维码 / 打开图书馆链接进来：验证访问码，存进本次会话，再进入图书馆。没登录时登录守卫会先去登录，再回到这里 */
export default function LibraryAccessPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !code) return;
    let cancelled = false;
    dispatch(verifyLibraryAccess(code))
      .unwrap()
      .then(() => {
        if (cancelled) return;
        setLibraryAccessCode(code);
        router.replace("/library");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        clearLibraryAccessCode();
        setError(errorMessage(e, "This library link is no longer valid"));
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, code, user, router]);

  return (
    <>
      <CustomHeader pageTitle="Library" showLogo={true} />
      <PageTitle title="Library" showPageTitle />
      <div className="mx-auto w-full max-w-md p-4 min-h-screen mt-0 md:mt-16">
        {error ? (
          <p className="rounded-md border border-border bg-white p-4 text-sm text-dark-gray" role="alert">
            {error}. Please ask a library manager for the current link or QR code.
          </p>
        ) : (
          <p className="text-sm text-dark-gray">Opening the library…</p>
        )}
      </div>
    </>
  );
}

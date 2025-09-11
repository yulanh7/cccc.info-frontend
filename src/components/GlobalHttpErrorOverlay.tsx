'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ServerErrorInfo } from '@/app/features/request';

export default function GlobalHttpErrorOverlay() {
  const [err, setErr] = useState<ServerErrorInfo | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<ServerErrorInfo>;
      setErr(ce.detail);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('global-http-5xx', handler as EventListener);
      return () => window.removeEventListener('global-http-5xx', handler as EventListener);
    }
  }, []);

  if (!err) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-md w-[92%] rounded-2xl bg-white p-6 shadow-xl">
        <div className="text-lg font-semibold">
          {err.code} Internal Server Error
        </div>
        <div className="mt-2 text-sm text-gray-600 break-words">
          {err.message}
        </div>
        <div className="mt-3 text-xs text-gray-500 break-words">
          <div>Method: {err.method}</div>
          <div>URL: {err.url}</div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 border border-gray-300"
            onClick={() => router.push('/')}
          >
            返回首页
          </button>
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-black text-white"
            onClick={() => window.location.reload()}
          >
            刷新页面
          </button>
        </div>
      </div>
    </div>
  );
}

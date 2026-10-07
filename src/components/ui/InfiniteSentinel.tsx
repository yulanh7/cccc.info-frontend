"use client";

import React, { useEffect, useRef } from "react";

/**
 * 无限滚动的底部哨兵：进入视口（提前 300px）时调用 onLoadMore。
 * 加载中不重复请求；失败显示 Retry；没有更多时显示 endText。
 */
export default function InfiniteSentinel({
  hasMore,
  loading,
  error,
  onLoadMore,
  endText = "No more",
  showEnd = true,
}: {
  hasMore: boolean;
  loading: boolean;
  error?: string | null;
  onLoadMore: () => void;
  endText?: string;
  showEnd?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const cb = useRef(onLoadMore);
  cb.current = onLoadMore;

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore || loading || error) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) cb.current();
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, error]);

  return (
    <div ref={ref} className="py-4 text-center text-xs text-dark-gray/60">
      {loading && "Loading…"}
      {!loading && error && (
        <span>
          {error}{" "}
          <button type="button" className="underline" onClick={() => cb.current()}>
            Retry
          </button>
        </span>
      )}
      {!loading && !error && !hasMore && showEnd && endText}
    </div>
  );
}

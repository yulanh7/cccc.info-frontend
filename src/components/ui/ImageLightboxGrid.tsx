"use client";

import React from "react";
import clsx from "clsx";

export type ImageItem = {
  id?: number | string;
  url: string;
  filename?: string;
  alt?: string;
};

type Props = {
  items: ImageItem[];
  /** 网格容器的额外类 */
  className?: string;
  /** 网格布局类（默认 4/6/8 列） */
  gridClassName?: string;
  /** 缩略图 <img> 的类 */
  thumbClassName?: string;
  /** 是否显示底部的 1/N 计数 */
  showCounter?: boolean;
  /** 背景点击关闭（默认 true） */
  closeOnBackdropClick?: boolean;
  /** 初始打开索引（可选，通常不需要） */
  defaultIndex?: number;
};

export default function ImageLightboxGrid({
  items,
  className,
  gridClassName = "grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2",
  thumbClassName = "w-full h-full object-cover rounded-sm border border-border",
  showCounter = true,
  closeOnBackdropClick = true,
  defaultIndex = 0,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [idx, setIdx] = React.useState(defaultIndex);
  const touchStartX = React.useRef<number | null>(null);

  const hasItems = items && items.length > 0;

  const openAt = (i: number) => {
    setIdx(i);
    setOpen(true);
  };

  const close = () => setOpen(false);

  const prev = React.useCallback(() => {
    if (!hasItems) return;
    setIdx((i) => (i - 1 + items.length) % items.length);
  }, [items.length, hasItems]);

  const next = React.useCallback(() => {
    if (!hasItems) return;
    setIdx((i) => (i + 1) % items.length);
  }, [items.length, hasItems]);

  // 键盘左右/Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next]);

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    // 阈值 40px
    if (dx > 40) prev();
    if (dx < -40) next();
    touchStartX.current = null;
  };

  if (!hasItems) return null;

  return (
    <div className={clsx(className)}>
      {/* 缩略图网格 */}
      <ul className={gridClassName}>
        {items.map((img, i) => (
          <li
            key={`${img.id ?? img.url}-${i}`}
            className="relative cursor-zoom-in aspect-square"
            onClick={() => openAt(i)}
            title="Click to preview"
          >
            <img
              src={img.url}
              alt={img.alt || img.filename || `image-${i + 1}`}
              className={thumbClassName}
              loading="lazy"
            />
          </li>
        ))}
      </ul>

      {/* 灯箱 */}
      {open && items[idx] && (
        <div
          className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center"
          onClick={closeOnBackdropClick ? close : undefined}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          aria-modal="true"
          role="dialog"
        >
          {/* 关闭按钮 */}
          <button
            className="absolute top-4 right-4 text-white p-1 rounded hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="Close preview"
            title="Close"
          >
            {/* XMarkIcon 简易版（避免依赖） */}
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>

          {/* 上一张 */}
          <button
            className="absolute left-3 md:left-6 text-white p-2 rounded hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous image"
            title="Previous"
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 图片本体（阻止冒泡，避免点图关闭） */}
          <img
            src={items[idx].url}
            alt={items[idx].alt || items[idx].filename || `image-${idx + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />

          {/* 下一张 */}
          <button
            className="absolute right-3 md:right-6 text-white p-2 rounded hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next image"
            title="Next"
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* 计数器 */}
          {showCounter && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              {idx + 1}/{items.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

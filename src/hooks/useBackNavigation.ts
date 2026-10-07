"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * 返回导航 + 列表滚动位置恢复
 *
 * - 列表页（useScrollRestoration）会记下自己当前的完整网址（含页码、筛选）和滚动位置。
 * - 返回箭头 / "Back to …"（useBackNavigation）：如果是从那个列表页过来的，就跳回记下的网址，
 *   列表加载完后滚回原来的位置；直接打开链接进来的，才跳到固定地址。
 *   不用浏览器的 history.back()：子页面里切换筛选 / 翻页也会产生历史记录，退一步回不到列表页。
 * - 浏览器自带的后退键也会恢复滚动位置。
 *
 * 只用 sessionStorage，读写失败（隐私模式等）时退化为普通跳转、不恢复滚动。
 */

const PREV_PATH_KEY = "nav:prevPath";
const RETURN_AT_KEY = "nav:returnAt";
const HREF_PREFIX = "nav:href:";
const SCROLL_PREFIX = "nav:scroll:";
/** 发起返回之后多久内挂载的列表页才恢复滚动 */
const RETURN_WINDOW_MS = 3000;

const read = (k: string) => {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    /* 忽略 */
  }
};

const currentHref = () => window.location.pathname + window.location.search;
const markReturning = () => write(RETURN_AT_KEY, String(Date.now()));

/** 在全局布局里调用一次：记录上一个页面的路径，以及浏览器后退 / 前进 */
export function useNavigationTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current && lastPath.current !== pathname) write(PREV_PATH_KEY, lastPath.current);
    lastPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("popstate", markReturning);
    return () => window.removeEventListener("popstate", markReturning);
  }, []);
}

/** 返回到 fallbackHref 所在的列表页；是从那一页过来的就回到离开时的网址和滚动位置 */
export function useBackNavigation(fallbackHref: string) {
  const router = useRouter();
  return useCallback(
    (e?: { preventDefault: () => void }) => {
      e?.preventDefault();
      const target = fallbackHref.split("?")[0];
      const saved = read(HREF_PREFIX + target);
      if (saved && read(PREV_PATH_KEY) === target) {
        markReturning();
        router.push(saved);
      } else {
        router.push(fallbackHref);
      }
    },
    [router, fallbackHref]
  );
}

/** 列表页用：ready = 列表已加载完。记下当前网址和滚动位置；通过返回回到这一页时滚回原来的位置 */
export function useScrollRestoration(ready: boolean) {
  const pathname = usePathname();

  // 挂载时判断是不是通过返回进来的
  const cameBack = useRef<boolean | null>(null);
  if (cameBack.current === null && typeof window !== "undefined") {
    cameBack.current = Date.now() - Number(read(RETURN_AT_KEY) || 0) < RETURN_WINDOW_MS;
  }
  const restored = useRef(false);

  // 每次渲染都更新“这一页现在的网址”（翻页、改筛选都会重新渲染）
  useEffect(() => {
    write(HREF_PREFIX + pathname, currentHref());
  });

  // 滚动时记下位置（按当前网址，含页码和筛选）
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => write(SCROLL_PREFIX + currentHref(), String(Math.round(window.scrollY))));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // 列表加载完再滚回去（太早滚的话内容还没出来，页面不够高）
  useEffect(() => {
    if (!ready || restored.current || !cameBack.current) return;
    restored.current = true;
    const y = Number(read(SCROLL_PREFIX + currentHref()) || 0);
    if (y > 0) requestAnimationFrame(() => window.scrollTo(0, y));
  }, [ready]);
}

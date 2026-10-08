'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/features/hooks';
import { rehydrateAuth, fetchProfileThunk } from '@/app/features/auth/slice';
import { getToken } from '@/app/features/auth/token';
import Header from './Header';
import BottomNav from './BottomNav';
import { useNavigationTracker } from '@/hooks/useBackNavigation';
import { CHANGE_PASSWORD_PATH } from '@/app/features/request';
import { fetchUnreadCount, resetNotifications } from '@/app/features/notifications/slice';
import { errorCode } from "@/app/lib/errors";

const PUBLIC_PATHS = ['/', '/auth'];
const PROFILE_REFRESH_MS = 30_000;
const UNREAD_POLL_MS = 60_000;

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  // 记录上一页，供返回箭头回到离开时的列表位置
  useNavigationTracker();

  const user = useAppSelector((s) => s.auth.user);
  const isLoggedIn = !!user;

  const [bootstrapped, setBootstrapped] = useState(false);
  const didBootstrap = useRef(false);
  const lastProfileFetch = useRef(0);

  // 1) 恢复本地登录状态（同步 action，无 unwrap）
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;

    dispatch(rehydrateAuth());
    // permissions 可能被 admin 随时修改：有 token 就拉一次 profile 刷新本地用户信息
    if (getToken()) {
      dispatch(fetchProfileThunk());
      lastProfileFetch.current = Date.now();
    }
    setBootstrapped(true);
  }, [dispatch]);

  // 1b) 权限可能被别人改：网页切回前台、或换页时再刷新一次登录资料（最多每 30 秒一次）
  useEffect(() => {
    if (!bootstrapped) return;
    const refresh = () => {
      if (!getToken() || Date.now() - lastProfileFetch.current < PROFILE_REFRESH_MS) return;
      lastProfileFetch.current = Date.now();
      dispatch(fetchProfileThunk());
    };
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [bootstrapped, pathname, dispatch]);

  // 2) 登录守卫：等待 bootstrapped 再执行
  useEffect(() => {
    if (!bootstrapped) return;

    const isPublic = PUBLIC_PATHS.some((p) =>
      p === '/' ? pathname === '/' : pathname.startsWith(p)
    );

    if (!isLoggedIn && !isPublic) {
      // 带上查询参数（例如 ?comment=…），登录后回到完全相同的地址
      const next = encodeURIComponent((pathname || '/') + window.location.search);
      router.replace(`/auth?next=${next}`);
    }
  }, [bootstrapped, isLoggedIn, pathname, router]);

  // 2b) 通知未读数：登录后每 60 秒拉一次；页面不可见时暂停，回到页面立即拉；401 停止
  const mustChangePassword = !!user?.must_change_password;
  useEffect(() => {
    if (!bootstrapped) return;
    if (!isLoggedIn) {
      dispatch(resetNotifications());
      return;
    }
    if (mustChangePassword) return; // 改密码前其他接口都会 403
    let stopped = false;
    const poll = async () => {
      if (stopped || document.hidden) return;
      const res = await dispatch(fetchUnreadCount());
      if (fetchUnreadCount.rejected.match(res) && errorCode(res.payload) === 401) stopped = true;
    };
    poll();
    const timer = window.setInterval(poll, UNREAD_POLL_MS);
    const onVisible = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [bootstrapped, isLoggedIn, mustChangePassword, dispatch]);

  // 3) 管理员重置过密码：先改密码，不能进入其他页面
  useEffect(() => {
    if (!bootstrapped || !user?.must_change_password) return;
    if (pathname !== CHANGE_PASSWORD_PATH) router.replace(CHANGE_PASSWORD_PATH);
  }, [bootstrapped, user?.must_change_password, pathname, router]);

  return (
    <>
      {/* 打印（例如图书馆二维码）时隐藏网站导航 */}
      <div className="print:hidden">
        <Header
          isLoggedIn={isLoggedIn}
          userName={user?.firstName || 'Guest'}
          unreadCount={3}
        />
      </div>
      <main className="bg-bg pb-16 min-h-screen print:pb-0">{children}</main>
      <div className="print:hidden">
        <BottomNav unreadCount={3} />
      </div>
    </>
  );
}

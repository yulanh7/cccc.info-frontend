'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/features/hooks';
import { rehydrateAuth, fetchProfileThunk } from '@/app/features/auth/slice';
import { getToken } from '@/app/features/auth/token';
import Header from './Header';
import BottomNav from './BottomNav';
import { useNavigationTracker } from '@/hooks/useBackNavigation';

const PUBLIC_PATHS = ['/', '/auth'];

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

  // 1) 恢复本地登录状态（同步 action，无 unwrap）
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;

    dispatch(rehydrateAuth());
    // permissions 可能被 admin 随时修改：有 token 就拉一次 profile 刷新本地用户信息
    if (getToken()) dispatch(fetchProfileThunk());
    setBootstrapped(true);
  }, [dispatch]);

  // 2) 登录守卫：等待 bootstrapped 再执行
  useEffect(() => {
    if (!bootstrapped) return;

    const isPublic = PUBLIC_PATHS.some((p) =>
      p === '/' ? pathname === '/' : pathname.startsWith(p)
    );

    if (!isLoggedIn && !isPublic) {
      const next = encodeURIComponent(pathname || '/');
      router.replace(`/auth?next=${next}`);
    }
  }, [bootstrapped, isLoggedIn, pathname, router]);

  return (
    <>
      <Header
        isLoggedIn={isLoggedIn}
        userName={user?.firstName || 'Guest'}
        unreadCount={3}
      />
      <main className="bg-bg pb-16 min-h-screen">{children}</main>
      <BottomNav unreadCount={3} />
    </>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/features/hooks';
import { rehydrateAuth } from '@/app/features/auth/slice';
import Header from './Header';
import BottomNav from './BottomNav';

const PUBLIC_PATHS = ['/', '/auth'];

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const user = useAppSelector((s) => s.auth.user);
  const isLoggedIn = !!user;

  const [bootstrapped, setBootstrapped] = useState(false);
  const didBootstrap = useRef(false);

  // 1) 恢复本地登录状态（同步 action，无 unwrap）
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;

    dispatch(rehydrateAuth());
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

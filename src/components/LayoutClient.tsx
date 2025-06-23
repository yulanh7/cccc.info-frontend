'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/features/hooks';
import { rehydrateAuth } from '@/app/features/auth/slice';
import Header from './Header';
import BottomNav from './BottomNav';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const isLoggedIn = !!user;

  // 自动从 localStorage 恢复 Redux 登录状态
  useEffect(() => {
    dispatch(rehydrateAuth());
  }, [dispatch]);

  // 路由守卫逻辑
  useEffect(() => {
    const publicPaths = ['/', '/auth'];
    const isPublic = publicPaths.some((path) => pathname.startsWith(path));

    if (!isLoggedIn && !isPublic) {
      router.replace('/auth'); // 使用 replace 避免“回退跳回来”的问题
    }
  }, [isLoggedIn, pathname, router]);

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

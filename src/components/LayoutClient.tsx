// components/LayoutClient.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/features/hooks';
import Header from './Header';
import BottomNav from './BottomNav';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const isLoggedIn = !!user;

  useEffect(() => {
    if (!isLoggedIn && !window.location.pathname.startsWith('/login')) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  return (
    <>
      <Header isLoggedIn={isLoggedIn} userName={user?.firstName || 'Guest'} unreadCount={3} />
      <main className="bg-bg pb-16">{children}</main>
      <BottomNav unreadCount={3} />
    </>
  );
}

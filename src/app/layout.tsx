'use client';

import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Provider } from 'react-redux';
import { store } from '@/app/features/store';
import { useAppSelector } from '@/app/features/hooks';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAppSelector((state) => state.auth);
  const isLoggedIn = !!user;
  const userName = user?.firstName || 'Guest';
  const unreadCount = 3;

  return (
    <>
      <Header isLoggedIn={isLoggedIn} userName={userName} unreadCount={unreadCount} />
      <main className="bg-bg pb-16">{children}</main>
      <BottomNav unreadCount={unreadCount} />
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-dark-gray min-h-screen flex flex-col">
        <Provider store={store}>
          <LayoutContent>{children}</LayoutContent>
        </Provider>
      </body>
    </html>
  );
}
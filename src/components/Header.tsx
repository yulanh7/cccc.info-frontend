"use client";

import { useEffect, useRef } from 'react';
import Logo from '@/components/Logo';
import Menu from '@/components/Menu';

export default function Header({
  isLoggedIn,
  userName,
  unreadCount,
}: {
  isLoggedIn: boolean;
  userName: string;
  unreadCount: number;
}) {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        headerRef.current?.classList.add('scrolled');
      } else {
        headerRef.current?.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className="hidden md:flex fixed top-0 left-0 right-0 z-10 items-center justify-between p-4 border-b border-b-border bg-white transition-all duration-300 scrolled:p-2"
    >
      <Logo />
      <h1 className="text-2xl font-bold text-center flex-1">Canberra Christian Church</h1>
      <Menu isLoggedIn={isLoggedIn} userName={userName} unreadCount={unreadCount} />
    </header>
  );
}
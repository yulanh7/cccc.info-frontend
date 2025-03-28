"use client";

import { useEffect, useRef } from 'react';
import Logo from '@/components/Logo';
import Menu from '@/components/Menu';
import {
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const hideHeader = pathname.startsWith('/posts/') || pathname.startsWith('/messages/') || pathname.startsWith('/auth');

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

  if (hideHeader) return null;


  return (
    <header ref={headerRef} >
      <div className="md-header hidden md:flex fixed top-0 left-0 right-0 z-10 items-center justify-between px-6 py-4 bg-bg  transition-all duration-300" >
        <Logo />
        <Menu isLoggedIn={isLoggedIn} userName={userName} unreadCount={unreadCount} />
      </div>
      <div className="sm-header md:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-2 border-b border-b-border bg-bg">
        <Logo />
        <MagnifyingGlassIcon className="h-5 w-5 text-dark-gray" />
      </div>
    </header>
  );
}
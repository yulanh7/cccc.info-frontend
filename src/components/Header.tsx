"use client";

import { useEffect, useRef } from 'react';
import Logo from '@/components/Logo';
import Menu from '@/components/Menu';
import {
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';


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
    <header ref={headerRef} >
      <div className="hidden md:flex fixed top-0 left-0 right-0 z-10 items-center justify-between h-40 px-6 bg-bg  transition-all duration-300 scrolled:p-2 shadow-md" >
        <Logo />
        <Menu isLoggedIn={isLoggedIn} userName={userName} unreadCount={unreadCount} />
      </div>
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4 border-b border-b-border bg-bg h-16">
        <Logo />
        <MagnifyingGlassIcon className="h-6 w-6 text-gray-700" />
      </div>
    </header>
  );
}
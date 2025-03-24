"use client";
import { usePathname } from 'next/navigation';

import Link from 'next/link';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'; // 导入铃铛图标

interface TopNavItem {
  href: string;
  label: string;

}
export default function Menu({ isLoggedIn, userName, unreadCount }: { isLoggedIn: boolean; userName?: string; unreadCount?: number }) {
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/groups', label: 'Groups' }
  ]
  const pathname = usePathname();
  return (
    <nav className="flex items-center space-x-4">
      {navItems.map(item => {
        const isActive = pathname === item.href;
        return (
          <div className="flex space-x-4 text-xl" key={item.label}>
            <Link href={item.href} className={`text-dark-gray ${isActive ? 'text-dark-green' : 'text-dark-gray'
              }  hover:text-dark-green`}>
              {item.label}
            </Link>
          </div>
        )
      })}

      <div className="border-l border-gray-300 h-6 mx-4"></div>

      <div className="flex items-center space-x-4">
        {isLoggedIn ? (
          <span className="text-dark-gray hover:text-dark-green">{userName}</span>
        ) : (
          <Link href="/login" className="text-dark-gray hover:text-dark-green">
            Login
          </Link>
        )}
      </div>

      <div className="relative">
        <ChatBubbleLeftRightIcon className="h-6 w-6 text-dark-gray hover:text-dark-green" />
        {unreadCount && unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-light-red text-white text-xs rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </div>
    </nav >
  );
}
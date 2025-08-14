'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useAppDispatch } from '@/app/features/hooks';
import { logoutThunk } from '@/app/features/auth/slice';

interface TopNavItem {
  href: string;
  label: string;
}

export default function Menu({
  isLoggedIn,
  userName,
  unreadCount,
}: {
  isLoggedIn: boolean;
  userName?: string;
  unreadCount?: number;
}) {
  const navItems: TopNavItem[] = [
    { href: '/', label: 'Home' },
    { href: '/groups', label: 'Groups' },
  ];

  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logoutThunk());
    router.push('/auth');
  };

  return (
    <nav className="flex items-center space-x-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <div className="flex space-x-4 text-xl" key={item.label}>
            <Link
              href={item.href}
              className={`text-dark-gray ${isActive ? 'text-dark-green' : 'text-dark-gray'
                } hover:text-dark-green`}
            >
              {item.label}
            </Link>
          </div>
        );
      })}

      <div className="border-l border-gray-300 h-6 mx-4"></div>

      <div className="flex items-center space-x-4">
        {isLoggedIn && (
          <div className="relative group">
            <span className="cursor-pointer text-dark-gray group-hover:text-dark-green">
              {userName}
            </span>

            {/* 下拉菜单 */}
            <div className="absolute right-0 z-10 mt-0 w-40 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block">
              {/* <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-dark-gray hover:bg-gray-100 hover:text-dark-green"
              >
                Profile
              </Link> */}
              <button
                onClick={handleLogout}
                className="w-full text-left block px-4 py-2 text-sm text-dark-gray hover:bg-gray-100 hover:text-dark-green"
              >
                Logout
              </button>
            </div>
          </div>
        )}

      </div>

      <Link href="/messages" className="text-dark-gray hover:text-dark-green relative">
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
        {unreadCount && unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red text-white text-xs rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </Link>
    </nav>
  );
}

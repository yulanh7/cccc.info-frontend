'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HomeIcon as OutlineHomeIcon,
  UsersIcon as OutlineUsersIcon,
  UserIcon as OutlineUserIcon,
  DocumentTextIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as SolidHomeIcon,
  UsersIcon as SolidUsersIcon,
  UserIcon as SolidUserIcon,
} from '@heroicons/react/24/solid';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/app/features/hooks';
import { logoutThunk } from '@/app/features/auth/slice';

interface NavItem {
  href: string;
  label: string;
  outlineIcon: React.ComponentType<{ className?: string }>;
  solidIcon: React.ComponentType<{ className?: string }>;
  unreadCount?: number;
}

interface BottomNavProps {
  unreadCount: number;
}

export default function BottomNav({ }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const hideBottomNav =
    pathname.startsWith('/messages/') ||
    pathname.startsWith('/auth');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetAnim, setSheetAnim] = useState(false);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = sheetOpen ? 'hidden' : '';
    if (sheetOpen) requestAnimationFrame(() => setSheetAnim(true));
    else setSheetAnim(false);
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [sheetOpen]);

  const handleLogout = () => {
    dispatch(logoutThunk());
    router.push('/auth');
  };

  const isActiveHref = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const navItems: NavItem[] = [
    { href: '/', label: 'Home', outlineIcon: OutlineHomeIcon, solidIcon: SolidHomeIcon },
    { href: '/groups', label: 'Groups', outlineIcon: OutlineUsersIcon, solidIcon: SolidUsersIcon },
    // { href: '/messages', label: 'Message', outlineIcon: OutlineBellIcon, solidIcon: SolidBellIcon, unreadCount },
  ];

  if (hideBottomNav) return null;

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-bg border border-border rounded-lg shadow-lg flex justify-around items-center pt-1 pb-5">
        {navItems.map((item) => {
          const isActive = isActiveHref(item.href);
          const Icon = isActive ? item.solidIcon : item.outlineIcon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center relative ${isActive ? 'text-dark-green' : 'text-dark-gray'} hover:text-dark-green`}
            >
              <Icon className="h-6 w-6" />
              {/* {item.unreadCount !== undefined && item.unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red text-white text-xs rounded-full px-1.5 py-0.5">
                  {item.unreadCount}
                </span>
              )} */}
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}

        {/* Me -> 自适应高度 Bottom Sheet */}
        <button
          onClick={() => setSheetOpen(true)}
          className={`flex flex-col items-center ${isActiveHref('/me') ? 'text-dark-green' : 'text-dark-gray'} hover:text-dark-green`}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          aria-controls="me-sheet"
        >
          {isActiveHref('/me') ? <SolidUserIcon className="h-6 w-6" /> : <OutlineUserIcon className="h-6 w-6" />}
          <span className="text-xs">Me</span>
        </button>
      </nav>

      {/* Sheet（自适应高度） */}
      {sheetOpen && (
        <div
          id="me-sheet"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40"
          onClick={() => setSheetOpen(false)} // 点击遮罩关闭
        >
          {/* 遮罩 */}
          <div className={`absolute inset-0 bg-black/40 transition-opacity ${sheetAnim ? 'opacity-100' : 'opacity-0'}`} />

          {/* 面板主体（贴底，随内容自适应高度） */}
          <div
            className={`
              absolute inset-x-0 bottom-0 w-full
              bg-white border-t border-border rounded-t-2xl shadow-xl
              max-w-md mx-auto
              transform transition-transform duration-300
              ${sheetAnim ? 'translate-y-0' : 'translate-y-full'}
            `}
            onClick={(e) => e.stopPropagation()} // 阻止冒泡
          >
            <div className="px-5 pt-3 pb-4">
              {/* 顶部小把手（可选） */}
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300" aria-hidden />

              {/* 四个入口（2x2） */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <Link
                  href="/profile"
                  onClick={() => setSheetOpen(false)}
                  className="flex flex-col items-center rounded-xl border border-border p-4 active:scale-[0.98] transition"
                >
                  <OutlineUserIcon className="h-7 w-7 mb-1.5" />
                  <span className="text-sm">Profile</span>
                </Link>

                <Link
                  href="/posts/mine"
                  onClick={() => setSheetOpen(false)}
                  className="flex flex-col items-center rounded-xl border border-border p-4 active:scale-[0.98] transition"
                >
                  <DocumentTextIcon className="h-7 w-7 mb-1.5" />
                  <span className="text-sm">My Posts</span>
                </Link>

                <Link
                  href="my-groups"
                  onClick={() => setSheetOpen(false)}
                  className="flex flex-col items-center rounded-xl border border-border p-4 active:scale-[0.98] transition"
                >
                  <OutlineUsersIcon className="h-7 w-7 mb-1.5" />
                  <span className="text-sm">Groups I Created</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex flex-col items-center rounded-xl border border-border p-4 active:scale-[0.98] transition text-red"
                >
                  <ArrowRightStartOnRectangleIcon className="h-7 w-7 mb-1.5" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>

              <button
                onClick={() => setSheetOpen(false)}
                className="mt-4 w-full rounded-md border border-border py-2 text-sm hover:bg-gray-50 active:scale-[0.99] transition"
                style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

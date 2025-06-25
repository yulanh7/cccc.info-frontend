import { useState, useRef, useEffect } from 'react';
import {
  HomeIcon as OutlineHomeIcon,
  UsersIcon as OutlineUsersIcon,
  BellIcon as OutlineBellIcon,
  UserIcon as OutlineUserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as SolidHomeIcon,
  UsersIcon as SolidUsersIcon,
  BellIcon as SolidBellIcon,
  UserIcon as SolidUserIcon,
} from '@heroicons/react/24/solid';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/app/features/hooks';
import { logout } from '@/app/features/auth/slice';

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

export default function BottomNav({ unreadCount }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const hideBottomNav = pathname.startsWith('/posts/') || pathname.startsWith('/messages/') || pathname.startsWith('/auth');

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/auth');
  };

  const navItems: NavItem[] = [
    { href: '/', label: 'Home', outlineIcon: OutlineHomeIcon, solidIcon: SolidHomeIcon },
    { href: '/groups', label: 'Groups', outlineIcon: OutlineUsersIcon, solidIcon: SolidUsersIcon },
    { href: '/messages', label: 'Message', outlineIcon: OutlineBellIcon, solidIcon: SolidBellIcon, unreadCount },
  ];

  if (hideBottomNav) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-bg border border-border rounded-lg shadow-lg flex justify-around items-center pt-1 pb-5">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = isActive ? item.solidIcon : item.outlineIcon;
        return (
          <a
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center relative ${isActive ? 'text-dark-green' : 'text-dark-gray'} hover:text-dark-green`}
          >
            <Icon className="h-6 w-6" />
            {item.unreadCount !== undefined && item.unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red text-white text-xs rounded-full px-1.5 py-0.5">
                {item.unreadCount}
              </span>
            )}
            <span className="text-xs">{item.label}</span>
          </a>
        );
      })}

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu((prev) => !prev)}
          className={`flex flex-col items-center ${pathname === '/me' ? 'text-dark-green' : 'text-dark-gray'} hover:text-dark-green`}
        >
          {pathname === '/me' ? <SolidUserIcon className="h-6 w-6" /> : <OutlineUserIcon className="h-6 w-6" />}
          <span className="text-xs">Me</span>
        </button>

        {showMenu && (
          <div className="absolute bottom-8 right-0 w-36 bg-white border border-gray-200 shadow-lg rounded-lg z-20">
            <button
              onClick={() => router.push('/profile')}
              className="w-full text-left px-4 py-2 text-sm text-dark-gray hover:bg-gray-100"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-dark-gray hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

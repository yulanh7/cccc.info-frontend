"use client";

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
import { usePathname } from 'next/navigation';

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

  const navItems: NavItem[] = [
    { href: '/', label: 'Home', outlineIcon: OutlineHomeIcon, solidIcon: SolidHomeIcon },
    { href: '/groups', label: 'Groups', outlineIcon: OutlineUsersIcon, solidIcon: SolidUsersIcon },
    { href: '/messages', label: 'Message', outlineIcon: OutlineBellIcon, solidIcon: SolidBellIcon, unreadCount },
    { href: '/me', label: 'Me', outlineIcon: OutlineUserIcon, solidIcon: SolidUserIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-13 left-0 right-0 z-10 bg-white border border-border rounded-lg shadow-lg flex justify-around items-center h-16">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = isActive ? item.solidIcon : item.outlineIcon;
        return (
          <a
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center relative ${isActive ? 'text-dark-green' : 'text-dark-gray'
              } hover:text-dark-green`}
          >
            <Icon className="h-6 w-6" />
            {item.unreadCount !== undefined && item.unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-light-red text-white text-xs rounded-full px-1.5 py-0.5">
                {item.unreadCount}
              </span>
            )}
            <span className="text-xs">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
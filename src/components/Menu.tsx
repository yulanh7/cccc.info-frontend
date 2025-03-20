import Link from 'next/link';
import { BellIcon } from '@heroicons/react/24/outline'; // 导入铃铛图标


export default function Menu({ isLoggedIn, userName, unreadCount }: { isLoggedIn: boolean; userName?: string; unreadCount?: number }) {
  return (
    <nav className="flex items-center space-x-4">
      <div className="flex space-x-4">
        <Link href="/" className="text-gray-700 hover:text-gray-900">
          Home
        </Link>
        <Link href="/about" className="text-gray-700 hover:text-gray-900">
          Groups
        </Link>
        <Link href="/contact" className="text-gray-700 hover:text-gray-900">
          Admin
        </Link>
      </div>

      <div className="border-l border-gray-300 h-6 mx-4"></div>

      <div className="flex items-center space-x-4">
        {isLoggedIn ? (
          <span className="text-gray-700">{userName}</span>
        ) : (
          <Link href="/login" className="text-gray-700 hover:text-gray-900">
            Login
          </Link>
        )}
      </div>

      <div className="relative">
        <BellIcon className="h-6 w-6 text-gray-700" /> {/* 铃铛图标 */}
        {unreadCount && unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-purple text-xs rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </div>
    </nav>
  );
}
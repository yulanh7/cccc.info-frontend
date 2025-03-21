import {
  HomeIcon,
  UsersIcon,
  BellIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface BottomNavProps {
  unreadCount: number;
}

export default function BottomNav({ unreadCount }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border border-border rounded-lg shadow-lg flex justify-around items-center h-16">
      <a href="/" className="flex flex-col items-center text-gray-700 hover:text-blue-500">
        <HomeIcon className="h-6 w-6" />
        <span className="text-xs">Home</span>
      </a>
      <a href="/groups" className="flex flex-col items-center text-gray-700 hover:text-blue-500">
        <UsersIcon className="h-6 w-6" />
        <span className="text-xs">Groups</span>
      </a>
      <a href="/messages" className="flex flex-col items-center text-gray-700 hover:text-blue-500 relative">
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-light-red text-white text-xs rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
        <span className="text-xs">Message</span>
      </a>
      <a href="/me" className="flex flex-col items-center text-gray-700 hover:text-blue-500">
        <UserIcon className="h-6 w-6" />
        <span className="text-xs">Me</span>
      </a>
    </nav>
  );
}
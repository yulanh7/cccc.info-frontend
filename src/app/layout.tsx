import './globals.css';
import Header from '@/components/Header'; // 引入客户端组件
import Logo from '@/components/Logo';
import {
  HomeIcon,
  UsersIcon,
  BellIcon,
  UserIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoggedIn = true;
  const userName = 'John Doe';
  const unreadCount = 3;

  return (
    <html lang="en">
      <body className="bg-white text-gray-900 min-h-screen flex flex-col">
        <Header isLoggedIn={isLoggedIn} userName={userName} unreadCount={unreadCount} />

        <div className="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4 border-b border-b-border bg-white h-16">
          <Logo />
          <MagnifyingGlassIcon className="h-6 w-6 text-gray-700" />
        </div>

        <main className="flex-1 pt-16 md:pt-20 lg:pt-20 pb-24 md:pb-0 overflow-y-auto md:overflow-y-visible">
          {children}
        </main>

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
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
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
      </body>
    </html>
  );
}
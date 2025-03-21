import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import {
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoggedIn = true;
  const userName = "Rachel";
  const unreadCount = 3;

  return (
    <html lang="en">
      <body className="bg-white text-gray-900 min-h-screen flex flex-col">
        <Header isLoggedIn={isLoggedIn} userName={userName} unreadCount={unreadCount} />

        <div className="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4 border-b border-b-border bg-white h-16">
          <Logo />
          <MagnifyingGlassIcon className="h-6 w-6 text-gray-700" />
        </div>
        <main className="flex-1 pt-16 md:pt-40 pb-30 md:pb-0 overflow-y-auto md:overflow-y-visible">
          {children}
        </main>
        <BottomNav unreadCount={unreadCount} />
      </body>
    </html>
  );
}
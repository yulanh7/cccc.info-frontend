import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Provider } from 'react-redux';
import { store } from '@/app/features/store';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
  title?: string;
  showPageTitle?: boolean
}) {
  const isLoggedIn = true;
  const userName = "Rachel";
  const unreadCount = 3;

  return (
    <html lang="en">
      <body className="bg-bg text-dark-gray min-h-screen flex flex-col">
        <Provider store={store}>
          <Header isLoggedIn={isLoggedIn} userName={userName} unreadCount={unreadCount} />
          <main className="bg-bg pb-16">
            {children}
          </main>
          <BottomNav unreadCount={unreadCount} />
        </Provider>
      </body>
    </html>
  );
}
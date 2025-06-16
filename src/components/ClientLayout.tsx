import Header from './Header';
import BottomNav from './BottomNav';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, unreadCount } = useAuth();

  return (
    <>
      <Header 
        isLoggedIn={!!user} 
        userName={user?.firstName} 
        unreadCount={unreadCount} 
      />
      <main className="bg-bg pb-16">
        {children}
      </main>
      <BottomNav unreadCount={unreadCount} />
    </>
  );
} 
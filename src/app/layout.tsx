import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
  title?: string;
  showPageTitle?: boolean
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-dark-gray min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <main className="bg-bg pb-16">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
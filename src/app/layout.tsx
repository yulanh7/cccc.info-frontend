import './globals.css';
import ReduxProvider from '@/components/ReduxProvider';
import LayoutClient from '@/components/layout/LayoutClient';
import GlobalHttpErrorOverlay from '@/components/GlobalHttpErrorOverlay';

export const metadata = {
  title: 'Canberra Chinese Christian Church',
  description: '',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-dark-gray min-h-screen flex flex-col">
        <ReduxProvider>
          <GlobalHttpErrorOverlay />
          <LayoutClient>
            {children}
          </LayoutClient>
        </ReduxProvider>
      </body>
    </html>
  );
}

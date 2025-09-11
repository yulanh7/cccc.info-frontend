// app/layout.tsx
import './globals.css';
import ReduxProvider from '@/components/ReduxProvider';
import LayoutClient from '@/components/layout/LayoutClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Canberra Chinese Christian Church',
  description: '',
};

export default function RootLayout({
  children,
  // 并行路由 slot（有则渲染，无则为 undefined）
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode; // 重要：可选
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-dark-gray min-h-screen flex flex-col">
        <ReduxProvider>
          <LayoutClient>
            {children}
          </LayoutClient>

          {/* 并行路由出口：没有内容时渲染 null，不报错 */}
          {modal ?? null}
        </ReduxProvider>
      </body>
    </html>
  );
}

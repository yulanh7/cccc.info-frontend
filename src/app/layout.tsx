import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Logo from '@/components/Logo';
import Menu from '@/components/Menu';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Canberra Chinese Christian Church",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isLoggedIn = true;
  const userName = 'John Doe';
  const unreadCount = 3;
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="flex items-center justify-between p-4 border-b-border border-b">
          <Logo />
          <h1 className="text-2xl font-bold text-center flex-1">Canberra Christian Church</h1>
          <Menu isLoggedIn={isLoggedIn} userName={userName} unreadCount={unreadCount} />
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}


import { useEffect, useRef, useState } from 'react';
import Logo from '@/components/Logo';
import Menu from '@/components/layout/Menu';
// import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';

export default function Header({
  isLoggedIn,
  userName,
}: {
  isLoggedIn: boolean;
  userName: string;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const hideHeader = pathname.startsWith('/auth');
  const [isFixed, setIsFixed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const isScrollable = documentHeight > windowHeight;
      if (isScrollable && scrollPosition > 50) {
        setIsFixed(true);
        if (headerRef.current) {
          setHeaderHeight(headerRef.current.offsetHeight);
        }
      } else {
        setIsFixed(false);
        setHeaderHeight(0);

      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (hideHeader) return null;

  return (
    <>
      <header
        ref={headerRef}
        className={`transition-all duration-600 border-b-1 border-border ease-in-out container mx-auto bg-bg ${isFixed ? 'fixed top-0 left-0 right-0 z-10 shadow-md' : 'static'
          }`}
      >
        <div
          className={`md-header hidden md:flex items-center justify-between px-4 lg:px-6 ${isFixed ? 'py-2 shadow-lg' : 'py-4'
            }`}
        >
          <Logo isScrolled={isFixed} />
          <Menu isLoggedIn={isLoggedIn} userName={userName} />
        </div>

      </header>
      <div style={{ height: `${headerHeight}px` }}></div>
    </>
  );
}
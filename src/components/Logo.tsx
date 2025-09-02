import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  isScrolled?: boolean; // 是否滚动状态
}

export default function Logo({ isScrolled = false }: LogoProps) {
  return (
    <Link href="/">
      <Image
        src="/images/logo.png"
        alt="Logo"
        width={0}
        height={50}
        className={`w-auto transition-all duration-600 ${isScrolled ? 'h-[40px] md:h-[50px] lg:h-[60px]' : 'h-[40px] md:h-[60px] lg:h-[80px]'
          }`}
        sizes="(max-width: 767px) 40px, (max-width: 1023px) 60px, 80px"
        priority
      />
    </Link>
  );
}
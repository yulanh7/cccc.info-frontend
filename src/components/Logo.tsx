import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/">
      <Image
        src="/images/logo.png"
        alt="Logo"
        width={0}
        height={50}
        className="h-[40px] w-auto md:h-[80px] lg:h-[120px] scrolled:h-[40px] transition-all duration-300"
        sizes="(max-width: 767px) 40px, (max-width: 1023px) 80px, 120px"
        priority
      />
    </Link>
  );
}
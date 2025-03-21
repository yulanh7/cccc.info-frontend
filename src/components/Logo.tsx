import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className='bg-sky-50'>
      <Image
        src="/images/logo.png"
        alt="Logo"
        width={120}
        height={0}
        className="w-[40px] h-auto md:w-[80px] lg:w-[120px]"
        sizes="(max-width: 767px) 60px, (max-width: 1023px) 80px, 120px"
        priority
      />

    </Link>
  );
}
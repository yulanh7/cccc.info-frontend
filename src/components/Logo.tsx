import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/">
      <Image
        src="/images/logo.png"
        alt="Logo"
        width={120}
        height={0}
        className="w-[120px] h-auto md:w-[80px]"
        priority
      />
    </Link>
  );
}
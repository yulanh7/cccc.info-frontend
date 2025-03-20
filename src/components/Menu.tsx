import Link from 'next/link';

export default function Menu({ isLoggedIn, userName }: { isLoggedIn: boolean; userName?: string }) {
  return (
    <nav className="flex items-center space-x-4">
      <div className="flex space-x-4">
        <Link href="/" className="text-gray-700 hover:text-gray-900">
          Home
        </Link>
        <Link href="/about" className="text-gray-700 hover:text-gray-900">
          Groups
        </Link>
        <Link href="/contact" className="text-gray-700 hover:text-gray-900">
          Admin
        </Link>
      </div>

      <div className="border-l border-gray-300 h-6 mx-4"></div>

      <div className="flex items-center space-x-4">
        {isLoggedIn ? (
          <span className="text-gray-700">{userName}</span>
        ) : (
          <Link href="/login" className="text-gray-700 hover:text-gray-900">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
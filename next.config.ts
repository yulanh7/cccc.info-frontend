/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const origin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://localhost:5000';
    return [
      { source: '/api/:path*', destination: 'http://localhost:5000/api/:path*' },
      { source: '/files/:path*', destination: 'http://localhost:5000/files/:path*' }, // ✅
    ];
  },
};
module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:5000/api/:path*' },
      { source: '/files/:path*', destination: 'http://localhost:5000/files/:path*' }, // ✅
    ];
  },
};
module.exports = nextConfig;

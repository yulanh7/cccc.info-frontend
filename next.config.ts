/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const origin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://127.0.0.1:5000';
    return [
      { source: '/api/:path*', destination: `${origin}/api/:path*` },
      { source: '/files/:path*', destination: `${origin}/files/:path*` },
    ];
  },
};

module.exports = nextConfig;

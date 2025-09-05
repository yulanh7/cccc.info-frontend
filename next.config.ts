/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const origin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://localhost:5000';
    return [
      { source: '/api/:path*', destination: `${origin}/api/:path*` },
      { source: '/files/:path*', destination: `${origin}/files/:path*` },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

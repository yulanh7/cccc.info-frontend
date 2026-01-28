/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const origin = process.env.NEXT_BACKEND_ORIGIN || 'http://localhost:5000';
    return [
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

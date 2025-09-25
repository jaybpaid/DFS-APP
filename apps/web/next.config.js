/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    MCP_SERVER_URL: process.env.MCP_SERVER_URL || 'http://localhost:4000',
  },
  async rewrites() {
    return [
      {
        source: '/api/mcp/:path*',
        destination: `${process.env.MCP_SERVER_URL || 'http://localhost:4000'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

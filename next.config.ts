import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['next-themes'],
  },
  // Disable React refresh to avoid syntax errors
  reactStrictMode: false,
  // Add caching headers for better performance
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/ganjoor/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  // Disable Turbopack to use regular webpack
  // turbopack: {},
};

export default nextConfig;

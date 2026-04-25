import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['next-themes'],
  },
  compiler: {
    // Strip all console.* calls from production builds.
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,
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
  async rewrites() {
    return [
      // Backward compatibility for stale relative font URLs (e.g. /poet/5/utils/fonts/*)
      {
        source: '/:path*/utils/fonts/:fontFile',
        destination: '/fonts/:fontFile',
      },
    ];
  },
  // Use Turbopack with minimal config
  turbopack: {},
};

export default nextConfig;

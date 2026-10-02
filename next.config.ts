import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: false,
    qualities: [75, 100],
    localPatterns: [
      {
        pathname: '/api/files/**',
        search: '?type=image',
      },
      {
        pathname: '/**',
      }
    ],
  },
  async headers() {
    return [
      // 1. API Data - No Caching (Always get fresh data for Add/Edit/Delete/Restore)
      {
        source: '/api/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/api/user/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      // 2. User Uploads (Images & Audio) - Standard Caching (Relies on ?t= timestamp for cache busting)
      {
        source: '/api/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=86400',
          },
        ],
      },
      // 3. Static Assets (Favicon, TTS) - Aggressive Caching (Immutable)
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/tts',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;

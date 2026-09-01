import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: false,
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
};

export default nextConfig;

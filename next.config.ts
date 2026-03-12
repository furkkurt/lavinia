import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      { source: "/woman", destination: "/products?category=woman", permanent: false },
      { source: "/man", destination: "/products?category=man", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '23.95.193.212',
        port: '5000',
        pathname: '/user-content/**',
      },
      {
        protocol: 'https',
        hostname: '23.95.193.212',
        port: '5000',
        pathname: '/user-content/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/user-content/**',
      },
    ],
    unoptimized: true, // Disable image optimization for external images
  },
};

export default nextConfig;

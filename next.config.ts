import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      { source: "/woman", destination: "/urunler", permanent: false },
      { source: "/products", destination: "/urunler", permanent: true },
      { source: "/products/:path*", destination: "/urunler/:path*", permanent: true },
      { source: "/cart", destination: "/sepet", permanent: true },
      { source: "/checkout", destination: "/odeme", permanent: true },
      { source: "/profile", destination: "/profil", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/user-content/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/product-images/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/user-content/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/product-images/**',
      },
    ],
  },
};

export default nextConfig;

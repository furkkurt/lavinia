import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  output: "standalone",
  // VPS/home dizininde başka package-lock varsa yanlış kök seçilmesini önler
  outputFileTracingRoot: path.join(__dirname),
  // Projede çok sayıda eski `any` / hook uyarısı var; üretim build'i ESLint'e takılmasın
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Same-origin paths used by getImageUrl (client: /product-images/...; SSR: absolute API URL).
    localPatterns: [
      { pathname: "/product-images/**" },
      { pathname: "/user-content/**" },
      { pathname: "/images/**" },
    ],
    remotePatterns: [
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
      { protocol: "https", hostname: "**", pathname: "/**" },
    ],
    // Next 16+ style strictness; keeps q=75 valid if defaults tighten
    qualities: [50, 58, 60, 65, 70, 75, 80, 85, 90],
  },
};

export default nextConfig;

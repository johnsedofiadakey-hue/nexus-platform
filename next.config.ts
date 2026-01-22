import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SWC minification removed for this Next.js version compatibility
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // Enable compression
  compress: true,
  // Optimize bundle splitting
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;

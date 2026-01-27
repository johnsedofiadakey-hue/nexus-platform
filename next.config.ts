import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 🔥 CRITICAL FIX
   * Leaflet + React Strict Mode = double mount = crash
   */
  reactStrictMode: false,

  /**
   * 🚀 Production-ready output
   */
  output: "standalone",

  /**
   * 🛡️ Prevent Leaflet from being bundled incorrectly
   * (REQUIRED for Turbopack stability)
   */
  serverExternalPackages: ["leaflet"],

  /**
   * ⚠️ Build tolerances (your choice, preserved)
   */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  /**
   * 🧪 Experimental (CLEANED)
   */
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "192.168.100.216"],
    },

    /**
     * ❌ REMOVED react-leaflet
     * It causes hydration + ref reuse issues
     */
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "geolib",
    ],
  },

  /**
   * 🖼️ Image handling
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

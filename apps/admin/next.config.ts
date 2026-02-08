import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
    /**
     * 🔥 CRITICAL FIX
     * Leaflet + React Strict Mode = double mount = crash
     */
    reactStrictMode: false,

    /**
     * 🚀 Production-ready output
     */
    // output: "standalone",

    //@ts-ignore - Monorepo root for Turbopack
    turbopack: {
        root: path.join(__dirname, "../.."),
    },

    /**
     * 🛡️ Prevent Leaflet from being bundled incorrectly
     */
    serverExternalPackages: ["leaflet"],

    /**
     * ⚠️ Build tolerances (your choice, preserved)
     */
    typescript: {
        ignoreBuildErrors: true,
    },

    /**
     * 🧪 Experimental - Performance Optimizations
     */
    experimental: {
        serverActions: {
            allowedOrigins: ["localhost:3001", "192.168.100.216", "*.vercel.app"],
        },

        // ⚡️ OPTIMIZATION: Tree-shake large packages
        optimizePackageImports: [
            "lucide-react",
            "framer-motion",
            "recharts",
            "date-fns",
        ],

        // ⚡️ OPTIMIZATION: Parallel route processing
        ppr: false, // Keep false unless you need partial prerendering
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

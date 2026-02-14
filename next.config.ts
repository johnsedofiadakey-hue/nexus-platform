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
    // output: "standalone",

    //@ts-ignore - Next 15/16 workspace root detection
    turbopack: {
        root: process.cwd(),
    },

    /**
     * 🛡️ Prevent Leaflet from being bundled incorrectly
     */
    serverExternalPackages: ["leaflet"],

    /**
     * 🧪 Experimental - Performance Optimizations
     */
    experimental: {
        serverActions: {
            allowedOrigins: ["localhost:3000", "192.168.100.216", "*.vercel.app"],
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

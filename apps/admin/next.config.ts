import type { NextConfig} from "next";
import path from "path";

const nextConfig: NextConfig = {
    /**
     * 🔥 CRITICAL FIX
     * Leaflet + React Strict Mode = double mount = crash
     */
    reactStrictMode: false,

    /**
     * 🚀 Production-ready output
     * Use standalone for Docker/Railway, omit for Vercel
     */
    output: process.env.VERCEL ? undefined : "standalone",

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
        // ⚡️ OPTIMIZATION: Parallel route processing
        ppr: false, // Keep false unless you need partial prerendering
        
        serverActions: {
            allowedOrigins: ["localhost:3001", "192.168.100.216", "*.vercel.app", "*.railway.app"],
        },

        // ⚡️ OPTIMIZATION: Tree-shake large packages
        optimizePackageImports: [
            "lucide-react",
            "framer-motion",
            "recharts",
            "date-fns",
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

import type { NextConfig } from "next";
import * as path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: "/control",
  output: process.env.VERCEL ? undefined : "standalone",
  turbopack: {
    // @ts-ignore next workspace root typing
    root: path.join(__dirname, "../.."),
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3002", "*.vercel.app"],
    },
  },
};

export default nextConfig;

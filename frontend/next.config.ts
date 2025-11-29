import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This tells Vercel to ignore TypeScript errors during deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // This tells Vercel to ignore ESLint errors during deployment
  // @ts-ignore
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
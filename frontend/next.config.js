/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force ignore all TS and Lint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
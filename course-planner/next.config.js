// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
  },
  webpack: (config) => {
    config.optimization.moduleIds = 'deterministic';
    return config;
  }
};

module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@agent-shield/sdk"],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    return config;
  },
};

export default nextConfig;

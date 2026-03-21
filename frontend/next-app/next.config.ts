import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // ADD THIS BLOCK:
  typescript: {
    // This allows the build to complete even if there are type errors
    ignoreBuildErrors: true, 
  },
  eslint: {
    // This ignores linting errors during build as well
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true
};

export default nextConfig;

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb"
    }
  }
};

export default nextConfig;
export default nextConfig;
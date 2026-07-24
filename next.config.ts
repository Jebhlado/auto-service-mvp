import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,

  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
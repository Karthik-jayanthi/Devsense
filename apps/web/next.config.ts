import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://devsense-api-sbi1.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
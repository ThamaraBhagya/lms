import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // This catches everything starting with /api
        source: '/api/:path*',
        // This ADDS /api back to the beginning of the AWS call
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`, 
      },
    ];
  },
};

export default nextConfig;
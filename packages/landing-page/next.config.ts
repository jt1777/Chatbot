import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable the Next.js development indicator
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  // Ensure clean production builds
  poweredByHeader: false,
};

export default nextConfig;

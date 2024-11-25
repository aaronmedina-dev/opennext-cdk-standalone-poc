import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone", // Required for serverless deployment
  images: {
    domains: [], // Replace with valid domains if available, else leave it blank
  },
};
export default nextConfig;
import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Monorepo: trace server files from workspace root so Vercel/serverless bundles resolve correctly. */
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;

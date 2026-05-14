import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/favicon.ico", destination: "/favicon-32.png", permanent: false }];
  },
  /**
   * Do not set `outputFileTracingRoot` here for Vercel: with Root Directory =
   * `.../apps/dashboard-web`, a custom tracing root breaks resolution of
   * `next/dist/compiled/next-server/server.runtime.prod.js` in the serverless bundle.
   * Re-introduce only if this app imports sibling workspace packages at runtime.
   */
};

export default nextConfig;

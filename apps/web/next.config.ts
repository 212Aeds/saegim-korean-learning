import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.STATIC_PUBLISH === "true" ? { output: "export", trailingSlash: true,
    env: { NEXT_PUBLIC_FREE_PUBLISHING: "true", NEXT_PUBLIC_PAID_FEATURES_ENABLED: "false", NEXT_PUBLIC_API_URL: "" } } : {}),
  poweredByHeader: false,
  distDir: process.env.SORI_WEB_DIST_DIR ?? ".next",
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
};

export default nextConfig;

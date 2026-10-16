import type { NextConfig } from "next";

const hostedAi = process.env.SAEGIM_HOSTED_AI === "true" && process.env.NEXT_PUBLIC_FREE_PUBLISHING === "false";
const nextConfig: NextConfig = {
  ...(process.env.STATIC_PUBLISH === "true" ? { output: "export", trailingSlash: true,
    env: { NEXT_PUBLIC_FREE_PUBLISHING: hostedAi ? "false" : "true", NEXT_PUBLIC_PAID_FEATURES_ENABLED: "false", NEXT_PUBLIC_API_URL: hostedAi ? process.env.NEXT_PUBLIC_API_URL || "" : "", NEXT_PUBLIC_HOSTED_AI_ENABLED: hostedAi ? "true" : "false", NEXT_PUBLIC_LOCAL_SPEECH_URL: hostedAi ? "" : process.env.NEXT_PUBLIC_LOCAL_SPEECH_URL || "" } } : {}),
  poweredByHeader: false,
  distDir: process.env.SORI_WEB_DIST_DIR ?? ".next",
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import { validateEnv } from "./src/lib/env";

// Validasi seluruh Environment Variables wajib saat proses build (di Vercel maupun lokal)
const isBuild =
  process.argv.includes("build") ||
  process.env.NEXT_PHASE === "phase-production-build";
validateEnv({ isBuild });

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["firebase-admin"],
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/actions/expenses/list",
        destination: "/api/expenses",
      },
      {
        source: "/actions/expenses/create",
        destination: "/api/expenses",
      },
      {
        source: "/actions/expenses/update",
        destination: "/api/expenses",
      },
      {
        source: "/actions/expenses/delete",
        destination: "/api/expenses",
      },
      {
        source: "/actions/dashboard",
        destination: "/api/dashboard",
      },
      {
        source: "/actions/categories/list",
        destination: "/api/categories",
      },
      {
        source: "/actions/categories/create",
        destination: "/api/categories",
      },
      {
        source: "/actions/categories/delete",
        destination: "/api/categories",
      },
      {
        source: "/actions/telegram/settings",
        destination: "/api/telegram",
      },
      {
        source: "/actions/telegram/test",
        destination: "/api/telegram/test",
      },
    ];
  },
};

export default nextConfig;

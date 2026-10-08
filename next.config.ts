import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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

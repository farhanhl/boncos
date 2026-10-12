import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://boncos.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/register",
          "/docs",
          "/api/openapi",
          "/llms.txt",
          "/llms-full.txt",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/expenses",
          "/expenses/*",
          "/settings",
          "/settings/*",
          "/api/auth/*",
          "/api/expenses/*",
          "/api/telegram/*",
        ],
      },
      {
        // Explicit allowance for AI Agents and Search Crawlers
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Claude-Web",
          "Google-Extended",
          "Applebot",
          "Bingbot",
        ],
        allow: [
          "/",
          "/login",
          "/register",
          "/docs",
          "/api/openapi",
          "/llms.txt",
          "/llms-full.txt",
        ],
        disallow: [
          "/dashboard",
          "/expenses",
          "/settings",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const lines = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /opengraph-image",
          "Disallow: /posts/*/opengraph-image",
          "Disallow: /search-index.json",
          `Sitemap: ${siteConfig.url}${siteConfig.routes.sitemap}`,
          "",
        ];
        return new Response(lines.join("\n"), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const body = `User-agent: *\nAllow: /\nSitemap: ${siteConfig.url}${siteConfig.routes.sitemap}\n`;
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      },
    },
  },
});

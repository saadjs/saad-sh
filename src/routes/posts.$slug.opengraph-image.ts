import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl, ogImagePath } from "#/lib/utils";
import { siteConfig } from "#/site.config";

export const Route = createFileRoute("/posts/$slug/opengraph-image")({
  server: {
    handlers: {
      GET: () =>
        new Response(null, {
          status: 301,
          headers: {
            Location: absoluteUrl(ogImagePath(), siteConfig.url),
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        }),
    },
  },
});

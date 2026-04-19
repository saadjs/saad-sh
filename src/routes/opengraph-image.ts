import { createFileRoute } from "@tanstack/react-router";
import { ogImageResponse } from "#/lib/og-image";
import { siteConfig } from "#/site.config";

export const Route = createFileRoute("/opengraph-image")({
  server: {
    handlers: {
      GET: () =>
        ogImageResponse({
          title: siteConfig.name,
          description: siteConfig.description,
          titleSize: 72,
        }),
    },
  },
});

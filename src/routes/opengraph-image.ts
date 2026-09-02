import { createFileRoute } from "@tanstack/react-router";
import { ogImagePath } from "#/lib/utils";

// Cards are static files now; this only keeps previously shared URLs alive.
export const Route = createFileRoute("/opengraph-image")({
  server: {
    handlers: {
      GET: () =>
        new Response(null, {
          status: 301,
          headers: {
            Location: ogImagePath("site"),
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        }),
    },
  },
});

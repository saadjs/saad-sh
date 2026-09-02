import { createFileRoute } from "@tanstack/react-router";
import { ogImagePath } from "#/lib/utils";

// Cards are static files now; this only keeps previously shared URLs alive.
export const Route = createFileRoute("/posts/$slug/opengraph-image")({
  server: {
    handlers: {
      GET: ({ params }) =>
        new Response(null, {
          status: 301,
          headers: {
            Location: ogImagePath(params.slug),
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        }),
    },
  },
});

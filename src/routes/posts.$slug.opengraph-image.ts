import { createFileRoute } from "@tanstack/react-router";
import { ogImageResponse } from "#/lib/og-image";
import { getPostBySlug } from "#/lib/posts";

export const Route = createFileRoute("/posts/$slug/opengraph-image")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const post = await getPostBySlug(params.slug);
        if (!post?.metadata?.published) {
          return new Response("Not Found", { status: 404 });
        }
        const { title, description } = post.metadata;
        return ogImageResponse({ title, description });
      },
    },
  },
});

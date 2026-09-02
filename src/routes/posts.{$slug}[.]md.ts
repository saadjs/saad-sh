import { createFileRoute } from "@tanstack/react-router";
import { getPostBySlug, getPostRawContent } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

export const Route = createFileRoute("/posts/{$slug}.md")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const post = await getPostBySlug(params.slug);
        if (!post?.metadata?.published) {
          return new Response("Not Found", { status: 404 });
        }

        const { metadata } = post;
        const canonical = absoluteUrl(`${siteConfig.routes.posts}/${post.slug}`, siteConfig.url);
        const body = [
          `# ${metadata.title}`,
          "",
          ...(metadata.description ? [`> ${metadata.description}`, ""] : []),
          `Published: ${metadata.date}`,
          ...(metadata.tags.length > 0 ? [`Tags: ${metadata.tags.join(", ")}`] : []),
          `Source: ${canonical}`,
          "",
          "---",
          "",
          await getPostRawContent(post.slug),
          "",
        ].join("\n");

        return new Response(body, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});

import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PostCard } from "#/components/PostCard";
import { getAllTags, getPostsByTag } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

const loadTagData = createServerFn({ method: "GET" })
  .inputValidator((tag: string) => tag)
  .handler(async ({ data: tag }) => {
    const [tags, posts] = await Promise.all([getAllTags(), getPostsByTag(tag)]);
    const tagEntry = tags.get(tag);
    if (!tagEntry || posts.length === 0) return null;
    return { label: tagEntry.label, posts };
  });

export const Route = createFileRoute("/tags/$tag")({
  loader: async ({ params }) => {
    const data = await loadTagData({ data: params.tag });
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return {};
    const label = loaderData.label;
    const tagPath = `${siteConfig.routes.tags}/${params.tag}`;
    return {
      meta: [
        { title: `${siteConfig.tagPage.title(label)} | ${siteConfig.name}` },
        { name: "description", content: siteConfig.tagPage.description(label) },
        { property: "og:title", content: siteConfig.tagPage.title(label) },
        { property: "og:description", content: siteConfig.tagPage.description(label) },
        { property: "og:url", content: `${siteConfig.url}${tagPath}` },
        { name: "twitter:title", content: siteConfig.tagPage.title(label) },
        { name: "twitter:description", content: siteConfig.tagPage.description(label) },
      ],
      links: [{ rel: "canonical", href: absoluteUrl(tagPath, siteConfig.url) }],
    };
  },
  component: TagPage,
});

function TagPage() {
  const { label, posts } = Route.useLoaderData();

  return (
    <div>
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Posts tagged &ldquo;{label}&rdquo;
        </h1>
        <p className="mt-2 text-muted">{siteConfig.tagPage.summary(posts.length)}</p>
      </section>
      <div className="mt-10">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}

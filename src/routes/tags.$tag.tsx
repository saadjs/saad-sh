import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PostList } from "#/components/PostList";
import { HandNote, Marker } from "#/components/Sketch";
import { getAllTags, getPostsByTag } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

const loadTagData = createServerFn({ method: "GET" })
  .validator((tag: string) => tag)
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
      <header>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
          <h1 className="page-title">
            <span className="mb-2 block font-mono text-[0.8125rem] leading-normal font-normal tracking-normal text-muted">
              Posts tagged{" "}
            </span>
            <Marker>{label}</Marker>
          </h1>
          <HandNote arrow="down-left" tilt="-rotate-[4deg]" className="pb-2 text-[1.625rem]">
            {siteConfig.postsPage.countLabel(posts.length)}
          </HandNote>
        </div>
      </header>
      <div className="mt-10">
        <PostList posts={posts} />
      </div>
    </div>
  );
}

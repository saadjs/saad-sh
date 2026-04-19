import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllTags } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

export const Route = createFileRoute("/tags/")({
  loader: async () => {
    const tags = await getAllTags();
    return {
      tags: Array.from(tags.entries()).sort((a, b) => a[1].label.localeCompare(b[1].label)),
    };
  },
  head: () => ({
    meta: [
      { title: `${siteConfig.tagsPage.title} | ${siteConfig.name}` },
      { name: "description", content: siteConfig.tagsPage.description },
      { property: "og:title", content: siteConfig.tagsPage.title },
      { property: "og:description", content: siteConfig.tagsPage.description },
      { property: "og:url", content: `${siteConfig.url}${siteConfig.routes.tags}` },
      { name: "twitter:title", content: siteConfig.tagsPage.title },
      { name: "twitter:description", content: siteConfig.tagsPage.description },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(siteConfig.routes.tags, siteConfig.url) }],
  }),
  component: TagsPage,
});

function TagsPage() {
  const { tags } = Route.useLoaderData();

  return (
    <div>
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {siteConfig.tagsPage.heading}
        </h1>
        <p className="mt-2 text-muted">{siteConfig.tagsPage.intro}</p>
      </section>
      {tags.length === 0 ? (
        <p className="mt-10 text-muted">{siteConfig.tagsPage.emptyMessage}</p>
      ) : (
        <div className="mt-10 flex flex-wrap gap-x-4 gap-y-3">
          {tags.map(([slug, tag]) => (
            <Link
              key={slug}
              to="/tags/$tag"
              params={{ tag: slug }}
              className="inline-flex items-baseline gap-1 whitespace-nowrap text-orange-500 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:text-orange-400"
            >
              <span>{tag.label.toUpperCase()}</span>
              <span className="text-muted">({tag.count})</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

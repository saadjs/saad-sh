import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllTags } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

const loadTags = createServerFn({ method: "GET" }).handler(async () => {
  const tags = await getAllTags();
  return {
    tags: Array.from(tags.entries()).sort((a, b) => a[1].label.localeCompare(b[1].label)),
  };
});

export const Route = createFileRoute("/tags/")({
  loader: () => loadTags(),
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
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="page-title">{siteConfig.tagsPage.heading}</h1>
        <p className="font-mono text-[0.8125rem] text-muted">
          {siteConfig.tagsPage.tagCountLabel(tags.length)}
        </p>
      </header>
      {tags.length === 0 ? (
        <p className="mt-16 text-muted">{siteConfig.tagsPage.emptyMessage}</p>
      ) : (
        <ul className="mt-10">
          {tags.map(([slug, tag]) => (
            <li key={slug}>
              <Link
                to="/tags/$tag"
                params={{ tag: slug }}
                className="group flex items-baseline justify-between gap-8 py-2"
              >
                <span className="text-[0.9375rem] leading-6 text-foreground transition-colors group-hover:text-accent">
                  {tag.label}
                </span>
                <span className="shrink-0 font-mono text-[0.8125rem] leading-6 text-muted tabular-nums">
                  {siteConfig.tagsPage.countLabel(tag.count)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

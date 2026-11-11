import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllTags } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { PageHead } from "#/components/PageHead";
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
  const { tagsPage } = siteConfig;

  return (
    <div className="page">
      <PageHead title={tagsPage.heading} eyebrow={tagsPage.tagCountLabel(tags.length)} />
      {tags.length === 0 ? (
        <p className="text-muted">{tagsPage.emptyMessage}</p>
      ) : (
        <ul className="post-list">
          {tags.map(([slug, tag]) => (
            <li key={slug}>
              <Link to="/tags/$tag" params={{ tag: slug }} className="post-row justify-between">
                <span className="post-row-title">{tag.label}</span>
                <span className="eyebrow tabular-nums">{tagsPage.countLabel(tag.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

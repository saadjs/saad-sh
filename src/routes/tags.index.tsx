import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllTags } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { HandNote, MarkedTitle } from "#/components/Sketch";
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
      <header className="flex flex-wrap items-end gap-x-5 gap-y-2">
        <MarkedTitle text={siteConfig.tagsPage.heading} />
        <HandNote arrow="down-left" tilt="-rotate-[4deg]" className="pb-2 text-[1.625rem]">
          {siteConfig.tagsPage.tagCountLabel(tags.length)}
        </HandNote>
      </header>
      {tags.length === 0 ? (
        <p className="mt-16 text-muted">{siteConfig.tagsPage.emptyMessage}</p>
      ) : (
        <ul className="sketch-box mt-10 px-5 py-1.5">
          {tags.map(([slug, tag]) => (
            <li key={slug} className="border-b-[1.4px] border-dashed border-border last:border-b-0">
              <Link
                to="/tags/$tag"
                params={{ tag: slug }}
                className="group flex min-h-11 items-baseline justify-between gap-8 py-2.5"
              >
                <span className="font-medium text-foreground transition-colors group-hover:text-accent">
                  {tag.label}
                </span>
                <span className="shrink-0 font-mono text-[0.8125rem] text-muted tabular-nums">
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

import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PostList } from "#/components/PostList";
import { HandNote, MarkedTitle } from "#/components/Sketch";
import { countTags, getAllPosts } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";
import type { Post } from "#/lib/types";

function groupByYear(posts: Post[]): [string, Post[]][] {
  const years = new Map<string, Post[]>();
  for (const post of posts) {
    const year = post.metadata.date.slice(0, 4);
    const bucket = years.get(year);
    if (bucket) bucket.push(post);
    else years.set(year, [post]);
  }
  return Array.from(years.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

const loadPostArchive = createServerFn({ method: "GET" }).handler(async () => {
  const posts = await getAllPosts();
  const topTags = Array.from(countTags(posts).entries())
    .sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label))
    .slice(0, siteConfig.postsPage.topTagsLimit);
  return { years: groupByYear(posts), total: posts.length, topTags };
});

export const Route = createFileRoute("/posts/")({
  loader: () => loadPostArchive(),
  head: () => ({
    meta: [
      { title: `${siteConfig.postsPage.title} | ${siteConfig.name}` },
      { name: "description", content: siteConfig.postsPage.description },
      { property: "og:title", content: siteConfig.postsPage.title },
      { property: "og:description", content: siteConfig.postsPage.description },
      { property: "og:url", content: `${siteConfig.url}${siteConfig.routes.posts}` },
      { name: "twitter:title", content: siteConfig.postsPage.title },
      { name: "twitter:description", content: siteConfig.postsPage.description },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(siteConfig.routes.posts, siteConfig.url) }],
  }),
  component: PostsPage,
});

function PostsPage() {
  const { years, total, topTags } = Route.useLoaderData();
  const { postsPage } = siteConfig;

  return (
    <div>
      <header>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
          <MarkedTitle text={postsPage.heading} />
          <HandNote arrow="down-left" tilt="-rotate-[4deg]" className="pb-2 text-[1.625rem]">
            {postsPage.countLabel(total)}
          </HandNote>
        </div>
        <p className="mt-3.5 max-w-[32.5rem]">{postsPage.intro}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-[1.125rem] font-mono text-[0.8125rem] text-muted">
          {topTags.map(([slug, tag]) => (
            <Link
              key={slug}
              to="/tags/$tag"
              params={{ tag: slug }}
              className="inline-flex min-h-11 items-center transition-colors hover:text-accent"
            >
              {tag.label} {tag.count}
            </Link>
          ))}
          <Link to="/tags" className="pen-link inline-flex min-h-11 items-center text-foreground">
            {postsPage.allTagsLabel} →
          </Link>
        </div>
      </header>
      {total === 0 ? (
        <p className="mt-16 text-muted">{postsPage.emptyMessage}</p>
      ) : (
        <div className="mt-9 flex flex-col gap-11">
          {years.map(([year, posts], index) => (
            <section key={year} aria-labelledby={`year-${year}`}>
              <div className="mb-1 ml-1.5 flex flex-wrap items-end gap-x-[1.125rem]">
                <h2
                  id={`year-${year}`}
                  className={`hand text-[2.625rem] ${index % 2 === 0 ? "-rotate-3" : "rotate-2"}`}
                >
                  {year}
                </h2>
                {index === years.length - 1 && years.length > 1 && (
                  <HandNote className="pb-2">{postsPage.firstYearNote}</HandNote>
                )}
              </div>
              <PostList
                posts={posts}
                alt={index % 2 === 1}
                caption={postsPage.countLabel(posts.length)}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

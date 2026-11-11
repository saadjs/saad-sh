import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PostList } from "#/components/PostList";
import { PageHead } from "#/components/PageHead";
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
    <div className="page">
      <PageHead
        title={postsPage.heading}
        eyebrow={postsPage.countLabel(total)}
        intro={postsPage.intro}
      >
        <div className="flex flex-wrap items-center gap-x-[1.125rem]">
          {topTags.map(([slug, tag]) => (
            <Link key={slug} to="/tags/$tag" params={{ tag: slug }} className="ui-chip">
              {tag.label} <span>{tag.count}</span>
            </Link>
          ))}
          <Link to="/tags" className="ui-link inline-flex min-h-11 items-center text-[0.9375rem]">
            {postsPage.allTagsLabel} →
          </Link>
        </div>
      </PageHead>
      {total === 0 ? (
        <p className="text-muted">{postsPage.emptyMessage}</p>
      ) : (
        years.map(([year, posts]) => (
          <section key={year} aria-labelledby={`year-${year}`} className="year-group">
            <h2 id={`year-${year}`} className="year-title">
              {year}
            </h2>
            <PostList posts={posts} />
          </section>
        ))
      )}
    </div>
  );
}

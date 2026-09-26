import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PostList } from "#/components/PostList";
import { getAllPosts } from "#/lib/posts";
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
  return { years: groupByYear(posts), total: posts.length };
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
  const { years, total } = Route.useLoaderData();

  return (
    <div>
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="page-title">{siteConfig.postsPage.heading}</h1>
        <p className="shrink-0 font-mono text-xs text-muted">
          {siteConfig.postsPage.countLabel(total)}
        </p>
      </header>
      <p className="mt-3 text-[0.9375rem] text-muted">{siteConfig.postsPage.intro}</p>
      <Link
        to="/tags"
        className="touch-target mt-3 inline-block text-[0.8125rem] text-accent underline-offset-4 hover:underline"
      >
        Browse by topic →
      </Link>
      {total === 0 ? (
        <p className="mt-16 text-muted">{siteConfig.postsPage.emptyMessage}</p>
      ) : (
        <div className="mt-9 flex flex-col gap-9">
          {years.map(([year, posts]) => (
            <section key={year} aria-labelledby={`year-${year}`}>
              <h2 id={`year-${year}`} className="mb-3 font-mono text-xs font-normal text-muted">
                {year}
              </h2>
              <PostList posts={posts} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

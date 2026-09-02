import { createFileRoute, Link } from "@tanstack/react-router";
import { TagList } from "#/components/TagList";
import { getAllPosts } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { absoluteUrl, formatDate } from "#/lib/utils";
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

export const Route = createFileRoute("/posts/")({
  loader: async () => {
    const posts = await getAllPosts();
    return { years: groupByYear(posts), total: posts.length };
  },
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
      <section>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          {siteConfig.postsPage.eyebrow}
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          {siteConfig.postsPage.heading}
        </h1>
        <p className="mt-2 text-muted">
          {siteConfig.postsPage.intro} {siteConfig.postsPage.countLabel(total)}.
        </p>
      </section>
      {total === 0 ? (
        <p className="mt-10 text-muted">{siteConfig.postsPage.emptyMessage}</p>
      ) : (
        <div className="mt-10 flex flex-col gap-10">
          {years.map(([year, posts]) => (
            <section key={year}>
              <h2 className="text-sm font-medium text-faint">{year}</h2>
              <ul className="mt-3">
                {posts.map((post) => (
                  <li key={post.slug} className="border-b border-border py-3 last:border-0">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                      <Link
                        to="/posts/$slug"
                        params={{ slug: post.slug }}
                        className="text-foreground hover:underline"
                      >
                        {post.metadata.title}
                      </Link>
                      <time
                        dateTime={post.metadata.date}
                        className="shrink-0 text-sm text-muted tabular-nums"
                      >
                        {formatDate(post.metadata.date)}
                      </time>
                    </div>
                    {post.metadata.tags.length > 0 && (
                      <div className="mt-1.5">
                        <TagList tags={post.metadata.tags} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

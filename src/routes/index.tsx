import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PostList } from "#/components/PostList";
import { getAllPosts } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

const loadHomePosts = createServerFn({ method: "GET" }).handler(async () => {
  const posts = await getAllPosts();
  return { posts: posts.slice(0, siteConfig.homePage.postsLimit), total: posts.length };
});

export const Route = createFileRoute("/")({
  loader: () => loadHomePosts(),
  head: () => ({
    meta: [
      { title: siteConfig.name },
      { property: "og:title", content: siteConfig.name },
      { property: "og:url", content: siteConfig.url },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(siteConfig.routes.home, siteConfig.url) }],
  }),
  component: HomePage,
});

function HomePage() {
  const { posts, total } = Route.useLoaderData();

  return (
    <div>
      <header className="max-w-[29.375rem]">
        <h1 className="page-title mb-4">{siteConfig.homePage.heading}</h1>
        <p>{siteConfig.homePage.intro}</p>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] text-accent">
          <Link to="/about" className="touch-target underline-offset-4 hover:underline">
            More about me →
          </Link>
          <Link to="/projects" className="touch-target underline-offset-4 hover:underline">
            Projects →
          </Link>
        </div>
      </header>
      {posts.length === 0 ? (
        <p className="mt-10 text-muted">{siteConfig.homePage.emptyMessage}</p>
      ) : (
        <section className="mt-10" aria-labelledby="latest-writing">
          <h2 id="latest-writing" className="mb-4 font-mono text-xs font-normal text-muted">
            {siteConfig.homePage.postsHeading}
          </h2>
          <PostList posts={posts} />
          {total > posts.length && (
            <Link
              to="/posts"
              className="touch-target mt-6 inline-block text-[0.8125rem] text-accent underline-offset-4 hover:underline"
            >
              {siteConfig.homePage.allPostsLabel} →
            </Link>
          )}
        </section>
      )}
    </div>
  );
}

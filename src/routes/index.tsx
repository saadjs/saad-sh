import { createFileRoute, Link } from "@tanstack/react-router";
import { PostCard } from "#/components/PostCard";
import { getAllPosts } from "#/lib/posts";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

export const Route = createFileRoute("/")({
  loader: async () => {
    const posts = await getAllPosts();
    return { posts: posts.slice(0, siteConfig.homePage.postsLimit), total: posts.length };
  },
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
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          {siteConfig.homePage.postsEyebrow}
        </p>
      </div>
      {posts.length === 0 ? (
        <p className="text-muted">{siteConfig.homePage.emptyMessage}</p>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
          {total > posts.length && (
            <Link to="/posts" className="mt-8 inline-block text-sm text-accent hover:underline">
              {siteConfig.homePage.allPostsLabel} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

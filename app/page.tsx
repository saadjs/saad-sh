import { PostCard } from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/site.config";

export default async function HomePage() {
  const posts = await getAllPosts();

  return (
    <div className="space-y-10">
      <section className="surface-panel rounded-[1.75rem] px-6 py-8 sm:px-8">
        <p className="eyebrow">{siteConfig.homePage.eyebrow}</p>
        <h1 className="section-title mt-4 max-w-3xl text-3xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          {siteConfig.homePage.heading}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-400">
          {siteConfig.description}
        </p>
      </section>
      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 px-5 py-6 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          {siteConfig.homePage.emptyMessage}
        </p>
      ) : (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{siteConfig.homePage.postsEyebrow}</p>
              <h2 className="section-title mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {siteConfig.homePage.postsHeading}
              </h2>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
              {siteConfig.homePage.postsCountLabel(posts.length)}
            </p>
          </div>
          <div className="space-y-5">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

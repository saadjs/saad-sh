import Link from "next/link";
import { formatDate, slugifyTag } from "@/lib/utils";
import { siteConfig } from "@/site.config";
import type { Post } from "@/lib/types";

interface RelatedPostsProps {
  posts: Post[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-12 border-t border-zinc-200/80 pt-10 dark:border-zinc-800">
      <h2 className="eyebrow mb-6">{siteConfig.postPage.relatedPostsHeading}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group surface-panel rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-1"
          >
            <time className="block font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
              {formatDate(post.metadata.date)}
            </time>
            <h3 className="mt-2 text-base font-semibold text-zinc-900 transition-colors group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300">
              {post.metadata.title}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {post.metadata.tags.map((tag) => {
                const slug = slugifyTag(tag);
                if (!slug) return null;
                return (
                  <span
                    key={tag}
                    className="rounded-full border border-orange-200/80 bg-orange-50/80 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-tag dark:border-orange-500/20 dark:bg-orange-500/10"
                  >
                    #{tag.toUpperCase()}
                  </span>
                );
              })}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

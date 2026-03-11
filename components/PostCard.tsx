import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { TagList } from "./TagList";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group surface-panel rounded-[1.4rem] p-5 transition-transform duration-200 hover:-translate-y-1 sm:p-6">
      <Link
        href={`/posts/${post.slug}`}
        className="grid gap-4 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-6"
      >
        <div className="space-y-3">
          <time className="block font-mono text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            {formatDate(post.metadata.date)}
          </time>
          <span className="hidden h-px w-16 bg-zinc-200 dark:bg-zinc-800 md:block" />
        </div>
        <div>
          <h2 className="section-title text-xl font-semibold text-zinc-900 transition-colors group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300 sm:text-2xl">
            {post.metadata.title}
          </h2>
          <p className="mt-3 max-w-2xl text-[1.02rem] leading-7 text-zinc-600 dark:text-zinc-400">
            {post.metadata.description}
          </p>
        </div>
      </Link>
      <div className="mt-4 border-t border-zinc-200/80 pt-4 dark:border-zinc-800">
        <TagList tags={post.metadata.tags} />
      </div>
    </article>
  );
}

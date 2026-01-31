import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { TagList } from "./TagList";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group">
      <Link href={`/posts/${post.slug}`} className="block">
        <time className="text-sm text-zinc-500 dark:text-zinc-500">
          {formatDate(post.metadata.date)}
        </time>
        <h2 className="mt-2 text-xl font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300">
          {post.metadata.title}
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{post.metadata.description}</p>
      </Link>
      <div className="mt-3">
        <TagList tags={post.metadata.tags} />
      </div>
    </article>
  );
}

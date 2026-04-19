import { Link } from "@tanstack/react-router";
import { formatDate } from "#/lib/utils";
import { TagList } from "./TagList";
import type { Post } from "#/lib/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="py-6 border-b border-border last:border-0">
      <Link to="/posts/$slug" params={{ slug: post.slug }} className="block">
        <time dateTime={post.metadata.date} className="text-sm text-muted">
          {formatDate(post.metadata.date)}
        </time>
        <h2 className="mt-1 text-xl font-semibold text-foreground">{post.metadata.title}</h2>
        <p className="mt-1 text-muted leading-relaxed">{post.metadata.description}</p>
      </Link>
      <div className="mt-3">
        <TagList tags={post.metadata.tags} />
      </div>
    </article>
  );
}

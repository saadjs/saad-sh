import { Link } from "@tanstack/react-router";
import { formatDate } from "#/lib/utils";
import type { Post } from "#/lib/types";

interface PostListProps {
  posts: Post[];
  // Swaps the corner wobble so stacked boxes don't look stamped from one mould.
  alt?: boolean;
  caption?: string;
}

export function PostList({ posts, alt = false, caption }: PostListProps) {
  return (
    <div className={`sketch-box px-5 py-1.5 ${alt ? "sketch-box-alt" : ""}`.trim()}>
      <ul>
        {posts.map((post) => (
          <li
            key={post.slug}
            className="border-b-[1.4px] border-dashed border-border last:border-b-0"
          >
            <Link
              to="/posts/$slug"
              params={{ slug: post.slug }}
              className="group flex flex-wrap items-baseline gap-x-5 gap-y-0.5 py-[0.8125rem]"
            >
              <time
                dateTime={post.metadata.date}
                className="font-mono text-[0.8125rem] whitespace-nowrap text-muted tabular-nums"
              >
                {formatDate(post.metadata.date)}
              </time>
              <span className="min-w-0 flex-[1_1_20rem] font-medium transition-colors group-hover:text-accent">
                {post.metadata.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {caption && (
        <p className="border-t-[1.4px] border-dashed border-border pt-2 pb-1.5 font-mono text-xs text-muted">
          {caption}
        </p>
      )}
    </div>
  );
}

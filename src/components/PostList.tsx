import { Link } from "@tanstack/react-router";
import { formatDate } from "#/lib/utils";
import type { Post } from "#/lib/types";

interface PostListProps {
  posts: Post[];
  showYear?: boolean;
}

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  timeZone: "UTC",
});
const dateWithYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function PostList({ posts, showYear = false }: PostListProps) {
  return (
    <ul>
      {posts.map((post) => {
        const date = new Date(post.metadata.date);
        const label = Number.isNaN(date.getTime())
          ? post.metadata.date
          : (showYear ? dateWithYear : shortDate).format(date);
        return (
          <li key={post.slug}>
            <Link
              to="/posts/$slug"
              params={{ slug: post.slug }}
              className={`group grid items-baseline gap-x-4 py-[0.8125rem] sm:gap-x-5 ${showYear ? "grid-cols-[6.5rem_minmax(0,1fr)]" : "grid-cols-[3.5rem_minmax(0,1fr)]"}`}
            >
              <time
                dateTime={post.metadata.date}
                aria-label={formatDate(post.metadata.date)}
                className="whitespace-nowrap font-mono text-xs leading-6 text-muted tabular-nums"
              >
                {label}
              </time>
              <span className="text-[0.9375rem] leading-6 text-foreground underline-offset-4 transition-colors group-hover:text-accent group-hover:underline">
                {post.metadata.title}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

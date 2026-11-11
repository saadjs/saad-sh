import { Link } from "@tanstack/react-router";
import { formatDate } from "#/lib/utils";
import type { Post } from "#/lib/types";

// One markup for every style. `.post-row-desc` and `.post-row-tag` are hidden
// by default; a style shows them with CSS.
export function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul className="post-list">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link to="/posts/$slug" params={{ slug: post.slug }} className="post-row">
            <time dateTime={post.metadata.date} className="post-row-date">
              {formatDate(post.metadata.date)}
            </time>
            <span className="post-row-main">
              <span className="post-row-title">{post.metadata.title}</span>
              {post.metadata.description && (
                <span className="post-row-desc">{post.metadata.description}</span>
              )}
            </span>
            {post.metadata.tags[0] && (
              <span className="post-row-tag">{post.metadata.tags[0].toLowerCase()}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

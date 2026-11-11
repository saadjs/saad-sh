import { Link } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";
import type { Post } from "#/lib/types";

interface PostPagerProps {
  older: Post | null;
  newer: Post | null;
}

export function PostPager({ older, newer }: PostPagerProps) {
  if (!older && !newer) return null;

  return (
    <nav aria-label="More posts" className="post-pager">
      {older && (
        <Link to="/posts/$slug" params={{ slug: older.slug }} data-dir="older">
          <span className="post-pager-label">← {siteConfig.postPage.olderLabel}</span>
          <span className="post-pager-title">{older.metadata.title}</span>
        </Link>
      )}
      {newer && (
        <Link to="/posts/$slug" params={{ slug: newer.slug }} data-dir="newer">
          <span className="post-pager-label">{siteConfig.postPage.newerLabel} →</span>
          <span className="post-pager-title">{newer.metadata.title}</span>
        </Link>
      )}
    </nav>
  );
}

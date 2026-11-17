import { formatDate } from "#/lib/utils";
import { postTitleTransition } from "#/lib/transitions";
import { siteConfig } from "#/site.config";
import { TagList } from "./TagList";
import type { PostMetadata } from "#/lib/types";

interface PostHeaderProps {
  slug: string;
  metadata: PostMetadata;
  readingMinutes?: number;
  children?: React.ReactNode;
}

export function PostHeader({ slug, metadata, readingMinutes, children }: PostHeaderProps) {
  return (
    <header className="post-header">
      <div className="post-meta">
        <time dateTime={metadata.date}>{formatDate(metadata.date)}</time>
        {readingMinutes !== undefined && (
          <span className="post-reading-time">
            {siteConfig.postPage.readingTime(readingMinutes)}
          </span>
        )}
        {metadata.tags.length > 0 && <TagList tags={metadata.tags} />}
      </div>
      <h1 className="post-title">
        <span className="post-title-text" style={postTitleTransition(slug)}>
          {metadata.title}
        </span>
      </h1>
      {metadata.description && <p className="post-desc">{metadata.description}</p>}
      {children && <div className="post-actions">{children}</div>}
    </header>
  );
}

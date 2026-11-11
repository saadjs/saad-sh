import { formatDate } from "#/lib/utils";
import { TagList } from "./TagList";
import type { PostMetadata } from "#/lib/types";

interface PostHeaderProps {
  metadata: PostMetadata;
  children?: React.ReactNode;
}

export function PostHeader({ metadata, children }: PostHeaderProps) {
  return (
    <header className="post-header">
      <div className="post-meta">
        <time dateTime={metadata.date}>{formatDate(metadata.date)}</time>
        {metadata.tags.length > 0 && <TagList tags={metadata.tags} />}
      </div>
      <h1 className="post-title">{metadata.title}</h1>
      {metadata.description && <p className="post-desc">{metadata.description}</p>}
      {children && <div className="post-actions">{children}</div>}
    </header>
  );
}

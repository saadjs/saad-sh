import { formatDate } from "#/lib/utils";
import { siteConfig } from "#/site.config";
import { MarkedTitle } from "./Sketch";
import { TagList } from "./TagList";
import type { PostMetadata } from "#/lib/types";

interface PostHeaderProps {
  metadata: PostMetadata;
  children?: React.ReactNode;
}

export function PostHeader({ metadata, children }: PostHeaderProps) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.8125rem] text-muted">
        <time dateTime={metadata.date}>{formatDate(metadata.date)}</time>
        {metadata.tags.length > 0 && (
          <>
            <span>{siteConfig.postPage.tagsLabel}</span>
            <TagList tags={metadata.tags} />
          </>
        )}
      </div>
      <MarkedTitle
        text={metadata.title}
        className="mt-3 text-[clamp(2.25rem,7vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-foreground"
      />
      {metadata.description && (
        <p className="mt-4 leading-relaxed text-muted">{metadata.description}</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </header>
  );
}

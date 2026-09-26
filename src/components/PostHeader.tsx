import { formatDate } from "#/lib/utils";
import { TagList } from "./TagList";
import type { PostMetadata } from "#/lib/types";

interface PostHeaderProps {
  metadata: PostMetadata;
  children?: React.ReactNode;
}

export function PostHeader({ metadata, children }: PostHeaderProps) {
  return (
    <header>
      <h1 className="text-[2rem] leading-[1.15] font-medium tracking-tight text-foreground sm:text-[2.375rem]">
        {metadata.title}
      </h1>
      {metadata.description && (
        <p className="mt-4 leading-relaxed text-muted">{metadata.description}</p>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 font-mono text-[0.8125rem] text-muted">
        <div className="flex flex-wrap items-center gap-x-2.5">
          <time dateTime={metadata.date}>{formatDate(metadata.date)}</time>
          {metadata.tags.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <TagList tags={metadata.tags} />
            </>
          )}
        </div>
        {children}
      </div>
    </header>
  );
}

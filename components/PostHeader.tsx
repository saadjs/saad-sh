import { formatDate } from "@/lib/utils";
import { TagList } from "./TagList";
import type { PostMetadata } from "@/lib/types";

interface PostHeaderProps {
  metadata: PostMetadata;
  children?: React.ReactNode;
}

export function PostHeader({ metadata, children }: PostHeaderProps) {
  return (
    <header className="mb-12">
      <div className="flex items-start justify-between gap-4">
        <time className="text-sm text-muted">{formatDate(metadata.date)}</time>
        {children}
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {metadata.title}
      </h1>
      <p className="mt-4 text-lg text-muted leading-relaxed">{metadata.description}</p>
      <div className="mt-4">
        <TagList tags={metadata.tags} />
      </div>
    </header>
  );
}

import { formatDate } from "@/lib/utils";
import { siteConfig } from "@/site.config";
import { TagList } from "./TagList";
import type { PostMetadata } from "@/lib/types";

interface PostHeaderProps {
  metadata: PostMetadata;
  children?: React.ReactNode;
}

export function PostHeader({ metadata, children }: PostHeaderProps) {
  return (
    <header className="surface-panel mb-10 rounded-[1.75rem] px-6 py-7 sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <time className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
          {formatDate(metadata.date)}
        </time>
        {children}
      </div>
      <h1 className="section-title mt-3 max-w-3xl text-3xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-4xl">
        {metadata.title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        {metadata.description}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-zinc-200/80 pt-5 dark:border-zinc-800">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          {siteConfig.postPage.tagsLabel}
        </span>
        <TagList tags={metadata.tags} />
      </div>
    </header>
  );
}

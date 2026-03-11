import { formatDate } from "@/lib/utils";
import { TagList } from "./TagList";
import type { PostMetadata } from "@/lib/types";

interface PostHeaderProps {
  metadata: PostMetadata;
}

export function PostHeader({ metadata }: PostHeaderProps) {
  return (
    <header className="mb-8 border-b border-zinc-200 pb-8 dark:border-zinc-800">
      <time className="font-mono text-sm uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
        {formatDate(metadata.date)}
      </time>
      <h1 className="mt-2 font-mono text-3xl font-semibold tracking-[-0.04em] text-zinc-900 dark:text-zinc-100">
        {metadata.title}
      </h1>
      <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        {metadata.description}
      </p>
      <div className="mt-4">
        <TagList tags={metadata.tags} />
      </div>
    </header>
  );
}

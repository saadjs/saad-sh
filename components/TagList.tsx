import Link from "next/link";
import { slugifyTag } from "@/lib/utils";

interface TagListProps {
  tags: string[];
}

export function TagList({ tags }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const slug = slugifyTag(tag);
        if (!slug) return null;
        return (
          <Link
            key={tag}
            href={`/tags/${slug}`}
            className="rounded-full border border-orange-200/80 bg-orange-50/80 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-tag transition-colors hover:border-orange-300 hover:bg-orange-100 dark:border-orange-500/20 dark:bg-orange-500/10 dark:hover:border-orange-500/35 dark:hover:bg-orange-500/15"
          >
            #{tag.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}

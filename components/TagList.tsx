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
            className="text-sm text-tag transition-opacity hover:opacity-80"
          >
            #{tag.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { slugifyTag } from "#/lib/utils";

interface TagListProps {
  tags: string[];
}

export function TagList({ tags }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {tags.map((tag) => {
        const slug = slugifyTag(tag);
        if (!slug) return null;
        return (
          <Link
            key={tag}
            to="/tags/$tag"
            params={{ tag: slug }}
            className="text-sm text-orange-500 transition-colors hover:underline dark:text-orange-400"
          >
            {tag.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}

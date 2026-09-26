import { Link } from "@tanstack/react-router";
import { slugifyTag } from "#/lib/utils";

interface TagListProps {
  tags: string[];
}

export function TagList({ tags }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-x-2.5">
      {tags.map((tag) => {
        const slug = slugifyTag(tag);
        if (!slug) return null;
        return (
          <Link
            key={tag}
            to="/tags/$tag"
            params={{ tag: slug }}
            className="transition-colors hover:text-foreground"
          >
            {tag.toLowerCase()}
          </Link>
        );
      })}
    </div>
  );
}

import Link from "next/link";

interface TagListProps {
  tags: string[];
}

export function TagList({ tags }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/tags/${tag.toUpperCase()}`}
          className="text-sm text-tag transition-opacity hover:opacity-80"
        >
          #{tag.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}

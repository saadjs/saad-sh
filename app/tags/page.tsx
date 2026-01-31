import Link from "next/link";
import type { Metadata } from "next";
import { getAllTags } from "@/lib/posts";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: siteConfig.tagsPage.title,
  description: siteConfig.tagsPage.description,
};

export default async function TagsPage() {
  const tagCounts = await getAllTags();
  const tags = Array.from(tagCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {siteConfig.tagsPage.heading}
      </h1>
      {tags.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">{siteConfig.tagsPage.emptyMessage}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
            >
              <span className="text-tag">#{tag}</span>
              <span className="text-zinc-400 dark:text-zinc-500">({count})</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

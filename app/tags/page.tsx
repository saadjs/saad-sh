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
  const tags = Array.from(tagCounts.entries()).sort((a, b) => a[1].label.localeCompare(b[1].label));

  return (
    <div>
      <h1 className="mb-8 font-mono text-2xl font-semibold tracking-[-0.04em] text-zinc-900 dark:text-zinc-100">
        {siteConfig.tagsPage.heading}
      </h1>
      {tags.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">{siteConfig.tagsPage.emptyMessage}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map(([slug, tag]) => (
            <Link
              key={slug}
              href={`/tags/${slug}`}
              className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.12em] transition-opacity hover:opacity-80"
            >
              <span className="text-tag">#{tag.label.toUpperCase()}</span>
              <span className="text-zinc-400 dark:text-zinc-500">({tag.count})</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

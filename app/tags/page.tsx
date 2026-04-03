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
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {siteConfig.tagsPage.heading}
        </h1>
        <p className="mt-2 text-muted">{siteConfig.tagsPage.intro}</p>
      </section>
      {tags.length === 0 ? (
        <p className="mt-10 text-muted">{siteConfig.tagsPage.emptyMessage}</p>
      ) : (
        <div className="mt-10 flex flex-wrap gap-x-4 gap-y-3">
          {tags.map(([slug, tag]) => (
            <Link
              key={slug}
              href={`/tags/${slug}`}
              className="inline-flex items-baseline gap-1 whitespace-nowrap text-orange-500 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:text-orange-400"
            >
              <span>{tag.label.toUpperCase()}</span>
              <span className="text-muted">({tag.count})</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

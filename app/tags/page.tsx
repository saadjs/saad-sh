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
        <div className="mt-10 space-y-0">
          {tags.map(([slug, tag]) => (
            <Link
              key={slug}
              href={`/tags/${slug}`}
              className="flex items-center justify-between py-3 border-b border-border transition-colors hover:text-accent"
            >
              <span className="text-orange-500 dark:text-orange-400">
                {tag.label.toUpperCase()}
              </span>
              <span className="text-sm text-faint">
                {siteConfig.tagsPage.countLabel(tag.count)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

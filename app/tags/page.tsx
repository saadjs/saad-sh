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
    <div className="space-y-8">
      <section className="surface-panel rounded-[1.75rem] px-6 py-8 sm:px-8">
        <p className="eyebrow">{siteConfig.tagsPage.eyebrow}</p>
        <h1 className="section-title mt-4 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          {siteConfig.tagsPage.heading}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-400">
          {siteConfig.tagsPage.intro}
        </p>
      </section>
      {tags.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">{siteConfig.tagsPage.emptyMessage}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tags.map(([slug, tag]) => (
            <Link
              key={slug}
              href={`/tags/${slug}`}
              className="surface-panel flex items-center justify-between rounded-2xl px-4 py-4 font-mono text-sm uppercase tracking-[0.12em] transition-transform hover:-translate-y-0.5"
            >
              <span className="text-tag">#{tag.label.toUpperCase()}</span>
              <span className="rounded-full border border-zinc-200/80 px-2 py-1 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                {siteConfig.tagsPage.countLabel(tag.count)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

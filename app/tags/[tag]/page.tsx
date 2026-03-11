import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostCard } from "@/components/PostCard";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { siteConfig } from "@/site.config";

interface PageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const tags = await getAllTags();
  return Array.from(tags.keys()).map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const tags = await getAllTags();
  const tagEntry = tags.get(tag);
  const label = tagEntry?.label ?? tag;
  return {
    title: siteConfig.tagPage.title(label),
    description: siteConfig.tagPage.description(label),
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const [tags, posts] = await Promise.all([getAllTags(), getPostsByTag(tag)]);
  const tagEntry = tags.get(tag);
  if (!tagEntry) {
    notFound();
  }

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel rounded-[1.75rem] px-6 py-8 sm:px-8">
        <p className="eyebrow">{siteConfig.tagPage.eyebrow}</p>
        <h1 className="section-title mt-4 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          <span>Posts tagged</span> <span className="text-tag">#{tagEntry.label}</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-400">
          {siteConfig.tagPage.summary(posts.length)}
        </p>
      </section>
      <div className="space-y-5">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}

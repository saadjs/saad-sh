import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostCard } from "@/components";
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
  const normalizedTag = tag.toUpperCase();
  return {
    title: siteConfig.tagPage.title(normalizedTag),
    description: siteConfig.tagPage.description(normalizedTag),
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const normalizedTag = tag.toUpperCase();
  const posts = await getPostsByTag(normalizedTag);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {siteConfig.tagPage.heading(normalizedTag)}
      </h1>
      <div className="space-y-12">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}

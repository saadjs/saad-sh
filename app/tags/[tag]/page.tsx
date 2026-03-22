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
    <div>
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Posts tagged &ldquo;{tagEntry.label}&rdquo;
        </h1>
        <p className="mt-2 text-muted">{siteConfig.tagPage.summary(posts.length)}</p>
      </section>
      <div className="mt-10">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}

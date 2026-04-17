import type { Metadata } from "next";
import { PostCard } from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  alternates: {
    canonical: siteConfig.routes.home,
    types: siteConfig.alternateTypes,
  },
};

export default async function HomePage() {
  const posts = await getAllPosts();

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          {siteConfig.homePage.postsEyebrow}
        </p>
      </div>
      {posts.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

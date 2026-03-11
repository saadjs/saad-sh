import { PostCard } from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";

export default async function HomePage() {
  const posts = await getAllPosts();

  return (
    <div>
      <h1 className="mb-8 font-mono text-2xl font-semibold tracking-[-0.04em] text-zinc-900 dark:text-zinc-100">
        Latest
      </h1>
      {posts.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">No posts yet.</p>
      ) : (
        <div className="space-y-12">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

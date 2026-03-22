import { PostCard } from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/site.config";

export default async function HomePage() {
  const posts = await getAllPosts();

  return (
    <div>
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {siteConfig.homePage.heading}
        </h1>
        <p className="mt-2 text-muted leading-relaxed">{siteConfig.description}</p>
      </section>
      {posts.length === 0 ? (
        <p className="mt-10 text-muted">{siteConfig.homePage.emptyMessage}</p>
      ) : (
        <div className="mt-10">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

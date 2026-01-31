import fs from "fs";
import path from "path";
import type { Post, PostMetadata } from "./types";

const postsDirectory = path.join(process.cwd(), "content/posts");

export async function getAllPosts(): Promise<Post[]> {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const posts: Post[] = [];

  for (const fileName of fileNames) {
    if (!fileName.endsWith(".mdx")) continue;

    const slug = fileName.replace(/\.mdx$/, "");
    const post = await getPostBySlug(slug);

    if (post && post.metadata.published) {
      posts.push(post);
    }
  }

  return posts.sort(
    (a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime(),
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const filePath = path.join(postsDirectory, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const { metadata } = (await import(`@/content/posts/${slug}.mdx`)) as { metadata: PostMetadata };

  return {
    slug,
    metadata,
  };
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export async function getAllTags(): Promise<Map<string, number>> {
  const posts = await getAllPosts();
  const tagCounts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.metadata.tags) {
      const normalizedTag = tag.toUpperCase();
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
    }
  }

  return tagCounts;
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts();
  const normalizedTag = tag.toUpperCase();
  return posts.filter((post) => post.metadata.tags.some((t) => t.toUpperCase() === normalizedTag));
}

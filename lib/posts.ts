import fs from "fs";
import path from "path";
import { cache } from "react";
import type { ComponentType } from "react";
import type { Post, PostMetadata } from "./types";
import { slugifyTag } from "./utils";

const postsDirectory = path.join(process.cwd(), "content/posts");

const getPostModule = cache(async (slug: string) => {
  const filePath = path.join(postsDirectory, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const postModule = (await import(`@/content/posts/${slug}.mdx`)) as {
    default?: ComponentType;
    metadata: PostMetadata;
  };

  return postModule;
});

export async function getPostModuleBySlug(slug: string) {
  return getPostModule(slug);
}

export const getAllPosts = cache(async (): Promise<Post[]> => {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const slugs = fileNames
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
  const allPosts = await Promise.all(slugs.map((slug) => getPostBySlug(slug)));
  const posts = allPosts.filter((post): post is Post => Boolean(post && post.metadata.published));

  return posts.sort(
    (a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime(),
  );
});

export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  const postModule = await getPostModule(slug);
  if (!postModule) {
    return null;
  }
  const { metadata } = postModule;

  return {
    slug,
    metadata,
  };
});

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export const getAllTags = cache(
  async (): Promise<Map<string, { label: string; count: number }>> => {
    const posts = await getAllPosts();
    const tagCounts = new Map<string, { label: string; count: number }>();

    for (const post of posts) {
      for (const tag of post.metadata.tags) {
        const slug = slugifyTag(tag);
        if (!slug) continue;
        const existing = tagCounts.get(slug);
        if (existing) {
          existing.count += 1;
        } else {
          tagCounts.set(slug, { label: tag.toUpperCase(), count: 1 });
        }
      }
    }

    return tagCounts;
  },
);

export const getPostsByTag = cache(async (tag: string): Promise<Post[]> => {
  const posts = await getAllPosts();
  const normalizedTag = slugifyTag(tag);
  return posts.filter((post) => post.metadata.tags.some((t) => slugifyTag(t) === normalizedTag));
});

import type { Root } from "hast";
import { parseFrontmatter } from "./frontmatter";
import { renderMarkdown } from "./markdown";
import type { Post, PostWithBody } from "./types";
import { slugifyTag } from "./utils";

const sources = import.meta.glob<string>("../content/posts/*.md", {
  query: "?raw",
  import: "default",
});

const loaders = new Map(
  Object.entries(sources).map(([path, load]) => [path.slice(path.lastIndexOf("/") + 1, -3), load]),
);

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const load = loaders.get(slug);
  if (!load) return null;
  const { metadata } = parseFrontmatter(await load());
  return metadata.published ? { slug, metadata } : null;
}

export async function getAllPosts(): Promise<Post[]> {
  const posts = await Promise.all([...loaders.keys()].map(getPostBySlug));
  return posts
    .filter((post): post is Post => post !== null)
    .sort((a, b) => b.metadata.date.localeCompare(a.metadata.date) || a.slug.localeCompare(b.slug));
}

export async function getPostRawContent(slug: string): Promise<string> {
  const load = loaders.get(slug);
  if (!load) return "";
  const { metadata, body } = parseFrontmatter(await load());
  return metadata.published ? body : "";
}

export async function getAllPostsWithBody(): Promise<PostWithBody[]> {
  return Promise.all(
    (await getAllPosts()).map(async (post) => ({
      ...post,
      body: await getPostRawContent(post.slug),
    })),
  );
}

export async function getPostSlugs(): Promise<string[]> {
  return (await getAllPosts()).map((post) => post.slug);
}

const rendered = new Map<string, Promise<{ post: Post; hast: Root }>>();

export async function getRenderedPost(slug: string): Promise<{ post: Post; hast: Root } | null> {
  const post = await getPostBySlug(slug);
  if (!post) return null;
  if (!rendered.has(slug)) {
    rendered.set(
      slug,
      getPostRawContent(slug)
        .then(renderMarkdown)
        .then((hast) => ({ post, hast }))
        .catch((error: unknown) => {
          rendered.delete(slug);
          throw error;
        }),
    );
  }
  return rendered.get(slug)!;
}

export async function getAllTags(): Promise<Map<string, { label: string; count: number }>> {
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
        tagCounts.set(slug, { label: tag.toLowerCase(), count: 1 });
      }
    }
  }

  return tagCounts;
}

export async function getAdjacentPosts(
  slug: string,
): Promise<{ older: Post | null; newer: Post | null }> {
  const posts = await getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return { older: null, newer: null };
  return { older: posts[index + 1] ?? null, newer: posts[index - 1] ?? null };
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts();
  const normalizedTag = slugifyTag(tag);
  return posts.filter((post) => post.metadata.tags.some((t) => slugifyTag(t) === normalizedTag));
}

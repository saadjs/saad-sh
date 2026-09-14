import { env } from "cloudflare:workers";
import type { Root } from "hast";
import { RENDER_VERSION, parseHast, renderMarkdown } from "./markdown";
import type { Post, PostMetadata, PostWithBody } from "./types";
import { slugifyTag } from "./utils";

type PostRow = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string;
  image: string | null;
  published: number;
};

type PostBodyRow = PostRow & { body: string };
type RenderRow = PostBodyRow & { hast: string | null; render_version: number | null };

const METADATA_COLUMNS = "slug, title, description, date, tags, image, published";

function db(): D1Database {
  return env.CONTENT_DB;
}

function toPost(row: PostRow): Post {
  const metadata: PostMetadata = {
    title: row.title,
    description: row.description,
    date: row.date,
    tags: JSON.parse(row.tags) as string[],
    published: row.published === 1,
  };
  if (row.image) metadata.image = row.image;
  return { slug: row.slug, metadata };
}

export async function getAllPosts(): Promise<Post[]> {
  const { results } = await db()
    .prepare(
      `SELECT ${METADATA_COLUMNS} FROM posts
       WHERE published = 1 AND deleted_at IS NULL
       ORDER BY date DESC`,
    )
    .all<PostRow>();
  return results.map(toPost);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const row = await db()
    .prepare(`SELECT ${METADATA_COLUMNS} FROM posts WHERE slug = ? AND deleted_at IS NULL`)
    .bind(slug)
    .first<PostRow>();
  return row ? toPost(row) : null;
}

export async function getPostRawContent(slug: string): Promise<string> {
  const row = await db()
    .prepare("SELECT body FROM posts WHERE slug = ? AND deleted_at IS NULL")
    .bind(slug)
    .first<{ body: string }>();
  return row?.body ?? "";
}

export async function getAllPostsWithBody(): Promise<PostWithBody[]> {
  const { results } = await db()
    .prepare(
      `SELECT ${METADATA_COLUMNS}, body FROM posts
       WHERE published = 1 AND deleted_at IS NULL
       ORDER BY date DESC`,
    )
    .all<PostBodyRow>();
  return results.map((row) => ({ ...toPost(row), body: row.body }));
}

export async function getPostSlugs(): Promise<string[]> {
  const { results } = await db()
    .prepare("SELECT slug FROM posts WHERE deleted_at IS NULL")
    .all<{ slug: string }>();
  return results.map((row) => row.slug);
}

export async function getRenderedPost(slug: string): Promise<{ post: Post; hast: Root } | null> {
  const row = await db()
    .prepare(
      `SELECT ${METADATA_COLUMNS}, body, hast, render_version FROM posts
       WHERE slug = ? AND deleted_at IS NULL`,
    )
    .bind(slug)
    .first<RenderRow>();
  if (!row) return null;

  const post = toPost(row);
  if (row.hast && row.render_version === RENDER_VERSION) {
    return { post, hast: parseHast(row.hast) };
  }

  const hast = await renderMarkdown(row.body);
  await db()
    .prepare("UPDATE posts SET hast = ?, render_version = ? WHERE slug = ?")
    .bind(JSON.stringify(hast), RENDER_VERSION, slug)
    .run();

  return { post, hast };
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
        tagCounts.set(slug, { label: tag.toUpperCase(), count: 1 });
      }
    }
  }

  return tagCounts;
}

export async function getRelatedPosts(slug: string, limit = 3): Promise<Post[]> {
  const current = await getPostBySlug(slug);
  if (!current) return [];

  const all = await getAllPosts();
  const currentTags = current.metadata.tags.map(slugifyTag);

  const scored = all
    .filter((p) => p.slug !== slug)
    .map((post) => {
      const shared = post.metadata.tags.filter((t) => currentTags.includes(slugifyTag(t))).length;
      return { post, shared };
    })
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.shared - a.shared);

  return scored.slice(0, limit).map((entry) => entry.post);
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts();
  const normalizedTag = slugifyTag(tag);
  return posts.filter((post) => post.metadata.tags.some((t) => slugifyTag(t) === normalizedTag));
}

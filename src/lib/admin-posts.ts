import { env } from "cloudflare:workers";
import type { Root } from "hast";
import { RENDER_VERSION, renderMarkdown } from "./markdown";
import type { Post } from "./types";

export type PostFields = {
  title: string;
  description: string;
  date: string;
  tags: string[];
  image: string | null;
  body: string;
};

export type AdminPostSummary = {
  slug: string;
  title: string;
  date: string;
  published: boolean;
  updatedAt: string;
  draftUpdatedAt: string | null;
};

export type AdminPostDetail = {
  slug: string;
  published: boolean;
  updatedAt: string;
  live: PostFields;
  draft: PostFields | null;
  draftVersion: string | null;
};

type FieldRow = {
  title: string;
  description: string;
  date: string;
  tags: string;
  image: string | null;
  body: string;
};

function db(): D1Database {
  return env.CONTENT_DB;
}

function toFields(row: FieldRow): PostFields {
  return {
    title: row.title,
    description: row.description,
    date: row.date,
    tags: JSON.parse(row.tags) as string[],
    image: row.image,
    body: row.body,
  };
}

export async function listAdminPosts(): Promise<AdminPostSummary[]> {
  const { results } = await db()
    .prepare(
      `SELECT p.slug, p.title, p.date, p.published, p.updated_at, d.updated_at AS draft_updated_at
       FROM posts p
       LEFT JOIN drafts d ON d.slug = p.slug
       WHERE p.deleted_at IS NULL
       ORDER BY p.date DESC`,
    )
    .all<{
      slug: string;
      title: string;
      date: string;
      published: number;
      updated_at: string;
      draft_updated_at: string | null;
    }>();

  return results.map((row) => ({
    slug: row.slug,
    title: row.title,
    date: row.date,
    published: row.published === 1,
    updatedAt: row.updated_at,
    draftUpdatedAt: row.draft_updated_at,
  }));
}

export async function getAdminPost(slug: string): Promise<AdminPostDetail | null> {
  const live = await db()
    .prepare(
      `SELECT title, description, date, tags, image, body, published, updated_at
       FROM posts WHERE slug = ? AND deleted_at IS NULL`,
    )
    .bind(slug)
    .first<FieldRow & { published: number; updated_at: string }>();
  if (!live) return null;

  const draft = await db()
    .prepare(
      "SELECT title, description, date, tags, image, body, version FROM drafts WHERE slug = ?",
    )
    .bind(slug)
    .first<FieldRow & { version: string }>();

  return {
    slug,
    published: live.published === 1,
    updatedAt: live.updated_at,
    live: toFields(live),
    draft: draft ? toFields(draft) : null,
    draftVersion: draft?.version ?? null,
  };
}

export async function slugExists(slug: string): Promise<boolean> {
  const row = await db().prepare("SELECT 1 AS hit FROM posts WHERE slug = ?").bind(slug).first();
  return Boolean(row);
}

export async function createPost(slug: string, title: string): Promise<void> {
  const now = new Date().toISOString();
  const date = now.slice(0, 10);

  await db().batch([
    db()
      .prepare(
        `INSERT INTO posts (slug, title, description, date, tags, image, published, body, created_at, updated_at)
         VALUES (?, ?, '', ?, '[]', NULL, 0, '', ?, ?)`,
      )
      .bind(slug, title, date, now, now),
    db()
      .prepare(
        `INSERT INTO drafts (slug, title, description, date, tags, image, body, created_at, updated_at)
         VALUES (?, ?, '', ?, '[]', NULL, '', ?, ?)`,
      )
      .bind(slug, title, date, now, now),
  ]);
}

export async function saveDraft(slug: string, fields: PostFields): Promise<void> {
  const now = new Date().toISOString();

  await db()
    .prepare(
      `INSERT INTO drafts (slug, title, description, date, tags, image, body, created_at, updated_at, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title, description = excluded.description, date = excluded.date,
         tags = excluded.tags, image = excluded.image, body = excluded.body,
         updated_at = excluded.updated_at, version = excluded.version`,
    )
    .bind(
      slug,
      fields.title,
      fields.description,
      fields.date,
      JSON.stringify(fields.tags),
      fields.image,
      fields.body,
      now,
      now,
      crypto.randomUUID(),
    )
    .run();
}

export async function publishPost(slug: string): Promise<"published" | "not_found" | "conflict"> {
  const detail = await getAdminPost(slug);
  if (!detail) return "not_found";

  const fields = detail.draft ?? detail.live;
  return commitPublication(detail, await renderMarkdown(fields.body));
}

export async function commitPublication(
  detail: AdminPostDetail,
  tree: Root,
): Promise<"published" | "conflict"> {
  const { slug } = detail;
  const fields = detail.draft ?? detail.live;
  const hast = JSON.stringify(tree);
  const now = new Date().toISOString();

  const [updated] = await db().batch([
    db()
      .prepare(
        `UPDATE posts SET title = ?, description = ?, date = ?, tags = ?, image = ?, body = ?,
           hast = ?, render_version = ?, published = 1, updated_at = ?
         WHERE slug = ? AND deleted_at IS NULL AND updated_at = ?
           AND (SELECT version FROM drafts WHERE slug = ?) IS ?`,
      )
      .bind(
        fields.title,
        fields.description,
        fields.date,
        JSON.stringify(fields.tags),
        fields.image,
        fields.body,
        hast,
        RENDER_VERSION,
        now,
        slug,
        detail.updatedAt,
        slug,
        detail.draftVersion,
      ),
    db().prepare("DELETE FROM drafts WHERE slug = ? AND changes() = 1").bind(slug),
  ]);

  return updated.meta.changes === 1 ? "published" : "conflict";
}

export async function setPublished(slug: string, published: boolean): Promise<void> {
  await db()
    .prepare("UPDATE posts SET published = ?, updated_at = ? WHERE slug = ?")
    .bind(published ? 1 : 0, new Date().toISOString(), slug)
    .run();
}

export async function deletePost(slug: string): Promise<void> {
  const now = new Date().toISOString();
  await db().batch([
    db()
      .prepare("UPDATE posts SET deleted_at = ?, published = 0, updated_at = ? WHERE slug = ?")
      .bind(now, now, slug),
    db().prepare("DELETE FROM drafts WHERE slug = ?").bind(slug),
  ]);
}

export async function getRenderedDraft(slug: string): Promise<{ post: Post; hast: Root } | null> {
  const detail = await getAdminPost(slug);
  if (!detail) return null;

  const fields = detail.draft ?? detail.live;
  return {
    post: {
      slug,
      metadata: {
        title: fields.title,
        description: fields.description,
        date: fields.date,
        tags: fields.tags,
        published: detail.published,
        ...(fields.image ? { image: fields.image } : {}),
      },
    },
    hast: await renderMarkdown(fields.body),
  };
}

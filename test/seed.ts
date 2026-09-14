import { env } from "cloudflare:test";
import { parseFrontmatter } from "#/lib/frontmatter";
import postsSchema from "../migrations/content/0001_posts.sql?raw";
import authSchema from "../migrations/content/0002_admin_auth.sql?raw";
import draftVersion from "../migrations/content/0004_draft_version.sql?raw";
import dropRevisions from "../migrations/content/0003_drop_post_revisions.sql?raw";
import loginRateLimits from "../migrations/content/0005_login_rate_limits.sql?raw";

const posts = import.meta.glob<string>("./fixtures/posts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function statements(sql: string): string[] {
  return sql
    .replace(/--[^\n]*/g, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

let seeded = false;

export async function seedContent(): Promise<void> {
  if (seeded) return;

  for (const statement of [
    ...statements(postsSchema),
    ...statements(authSchema),
    ...statements(dropRevisions),
    ...statements(draftVersion),
    ...statements(loginRateLimits),
  ]) {
    await env.CONTENT_DB.prepare(statement).run();
  }

  const now = new Date().toISOString();
  const inserts = Object.entries(posts).map(([path, source]) => {
    const slug = path.slice(path.lastIndexOf("/") + 1, -3);
    const { metadata, body } = parseFrontmatter(source);
    return env.CONTENT_DB.prepare(
      `INSERT OR REPLACE INTO posts
         (slug, title, description, date, tags, image, published, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      slug,
      metadata.title,
      metadata.description ?? "",
      metadata.date,
      JSON.stringify(metadata.tags),
      metadata.image ?? null,
      metadata.published ? 1 : 0,
      body,
      now,
      now,
    );
  });

  await env.CONTENT_DB.batch(inserts);
  seeded = true;
}

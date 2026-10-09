import type { PostMetadata } from "./types";

export function parseFrontmatter(source: string): { metadata: PostMetadata; body: string } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error("No frontmatter block");

  const fields: Record<string, unknown> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const separator = line.indexOf(":");
    if (separator === -1) throw new Error(`Malformed frontmatter line: ${line}`);
    const key = line.slice(0, separator).trim();
    if (key in fields) throw new Error(`Duplicate frontmatter field: ${key}`);
    fields[key] = JSON.parse(line.slice(separator + 1).trim());
  }

  if (
    typeof fields.title !== "string" ||
    !fields.title.trim() ||
    typeof fields.description !== "string" ||
    typeof fields.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fields.date) ||
    !Number.isFinite(Date.parse(fields.date)) ||
    new Date(fields.date).toISOString().slice(0, 10) !== fields.date ||
    !Array.isArray(fields.tags) ||
    !fields.tags.every((tag) => typeof tag === "string") ||
    typeof fields.published !== "boolean" ||
    (fields.image !== undefined && typeof fields.image !== "string")
  ) {
    throw new Error("Invalid post frontmatter");
  }

  return { metadata: fields as unknown as PostMetadata, body: source.slice(match[0].length) };
}

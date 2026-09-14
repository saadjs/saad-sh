export type PostMetadata = {
  title: string;
  description?: string;
  date: string;
  tags: string[];
  published: boolean;
  image?: string;
};

const FIELD_ORDER = ["title", "description", "date", "tags", "published", "image"] as const;

export function serializeFrontmatter(metadata: PostMetadata): string {
  const lines = FIELD_ORDER.filter((key) => metadata[key] !== undefined).map(
    (key) => `${key}: ${JSON.stringify(metadata[key])}`,
  );
  return `---\n${lines.join("\n")}\n---\n`;
}

export function parseFrontmatter(source: string): { metadata: PostMetadata; body: string } {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) throw new Error("No frontmatter block");

  const fields: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim()) continue;
    const separator = line.indexOf(": ");
    if (separator === -1) throw new Error(`Malformed frontmatter line: ${line}`);
    fields[line.slice(0, separator).trim()] = JSON.parse(line.slice(separator + 2));
  }

  return {
    metadata: fields as PostMetadata,
    body: source.slice(match[0].length).trim(),
  };
}

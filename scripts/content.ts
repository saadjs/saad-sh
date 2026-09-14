import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { serializeFrontmatter } from "../src/lib/frontmatter.ts";
import { executeD1, queryD1, root } from "./d1.ts";

const [command, ...flags] = process.argv.slice(2);
if (!["export", "seed"].includes(command) || flags.some((flag) => flag !== "--remote")) {
  throw new Error("usage: content export [--remote] | content seed");
}
const remote = flags.includes("--remote");

if (command === "seed") {
  if (remote) throw new Error("Sample posts can only be seeded into local D1");
  await executeD1(false, [`--file=${join(root, "scripts/seed-content.sql")}`]);
  console.log("seeded sample posts into local D1 (existing posts preserved)");
} else {
  const rows = await queryD1<{
    slug: string;
    title: string;
    description: string;
    date: string;
    tags: string;
    image: string | null;
    published: number;
    body: string;
  }>(
    remote,
    "SELECT slug, title, description, date, tags, image, published, body FROM posts WHERE deleted_at IS NULL ORDER BY slug",
  );

  for (const row of rows) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)) {
      throw new Error(`Cannot export invalid slug: ${row.slug}`);
    }
  }
  const exportsDir = join(root, "exports");
  await mkdir(exportsDir, { recursive: true });
  const destination = await mkdtemp(join(exportsDir, `${remote ? "remote" : "local"}-`));
  for (const row of rows) {
    const metadata = {
      title: row.title,
      description: row.description,
      date: row.date,
      tags: JSON.parse(row.tags) as string[],
      published: row.published === 1,
      ...(row.image ? { image: row.image } : {}),
    };
    await writeFile(
      join(destination, `${row.slug}.md`),
      `${serializeFrontmatter(metadata)}${row.body}`,
      "utf8",
    );
  }
  console.log(`exported ${rows.length} posts to ${destination}`);
}

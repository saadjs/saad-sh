import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "../src/lib/frontmatter.ts";
import { renderMarkdown } from "../src/lib/markdown.ts";

const directory = new URL("../src/content/posts/", import.meta.url);
const files = (await readdir(directory)).filter((file) => file.endsWith(".md"));
for (const file of files) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(file)) {
    throw new Error(`Invalid post filename: ${file}`);
  }
  try {
    const { body } = parseFrontmatter(await readFile(new URL(file, directory), "utf8"));
    await renderMarkdown(body);
  } catch (error) {
    throw new Error(`Invalid post: ${fileURLToPath(new URL(file, directory))}`, { cause: error });
  }
}
console.log(`Validated ${files.length} repository posts`);

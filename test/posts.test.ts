import { exports } from "cloudflare:workers";
import { expect, it } from "vitest";
import { parseFrontmatter } from "#/lib/frontmatter";
import { getAllPosts, getPostRawContent, getRenderedPost } from "#/lib/posts";

it("renders every repository post and exposes it through discovery and Markdown", async () => {
  const posts = await getAllPosts();
  expect(posts.length).toBeGreaterThan(0);
  const discovery = await Promise.all(
    ["/feed.xml", "/sitemap.xml", "/llms.txt", "/search-index.json"].map(async (path) => {
      const response = await exports.default.fetch(`https://saad.sh${path}`);
      expect(response.status).toBe(200);
      return response.text();
    }),
  );
  for (const post of posts) {
    const rendered = await getRenderedPost(post.slug);
    expect(rendered?.hast.type, post.slug).toBe("root");
    expect(rendered?.post).toEqual(post);
    const response = await exports.default.fetch(`https://saad.sh/posts/${post.slug}.md`);
    expect(response.status, post.slug).toBe(200);
    expect(await response.text()).toContain(await getPostRawContent(post.slug));
    for (const body of discovery) expect(body, post.slug).toContain(post.slug);
  }
});

it("preserves Markdown whitespace and accepts CRLF frontmatter", () => {
  const body = "\nExample\n\n";
  expect(
    parseFrontmatter(
      '---\r\ntitle: "Example"\r\ndescription: ""\r\ndate: "2026-10-08"\r\ntags: []\r\npublished: true\r\n---\r\n' +
        body,
    ).body,
  ).toBe(body);
});

it.each([
  ["title", 1],
  ["date", "2026-02-30"],
  ["published", "false"],
  ["tags", [1]],
])("rejects invalid %s frontmatter", (key, value) => {
  const fields = {
    title: "Valid",
    description: "",
    date: "2026-10-08",
    tags: [],
    published: true,
    [key as string]: value,
  };
  const source = Object.entries(fields)
    .map(([name, field]) => `${name}: ${JSON.stringify(field)}`)
    .join("\n");
  expect(() => parseFrontmatter(`---\n${source}\n---\nBody`)).toThrow();
});

it("rejects duplicate frontmatter fields", () => {
  expect(() => parseFrontmatter('---\ntitle: "Valid"\ntitle: "Duplicate"\n---\nBody')).toThrow(
    "Duplicate",
  );
});

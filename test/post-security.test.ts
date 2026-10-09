import { exports } from "cloudflare:workers";
import { expect, it, vi } from "vitest";
import { getAllPosts, getPostBySlug, getPostRawContent, getRenderedPost } from "#/lib/posts";

vi.mock("../src/content/posts/get-complete-file-path.md?raw", () => ({
  default:
    '---\ntitle: "Private draft"\ndescription: "Hidden"\ndate: "2026-10-08"\ntags: ["secret"]\npublished: false\n---\nPRIVATE_SECURITY_MARKER',
}));

vi.mock("../src/content/posts/git-undo-last-commit.md?raw", () => ({
  default:
    '---\ntitle: "</script><script>globalThis.__reviewXss=1</script>"\ndescription: "Test"\ndate: "2026-10-08"\ntags: []\npublished: true\nimage: "/custom.png"\n---\nPublic body',
}));

it("excludes unpublished files from every public post read", async () => {
  expect(await getPostBySlug("get-complete-file-path")).toBeNull();
  expect(await getRenderedPost("get-complete-file-path")).toBeNull();
  expect(await getPostRawContent("get-complete-file-path")).toBe("");
  expect((await getAllPosts()).map((post) => post.slug)).not.toContain("get-complete-file-path");
  for (const path of [
    "/posts/get-complete-file-path",
    "/posts/get-complete-file-path.md",
    "/posts/get-complete-file-path?preview=old-token",
  ]) {
    const response = await exports.default.fetch(`https://saad.sh${path}`);
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain("PRIVATE_SECURITY_MARKER");
  }
  for (const path of [
    "/",
    "/posts",
    "/feed.xml",
    "/sitemap.xml",
    "/llms.txt",
    "/search-index.json",
    "/tags",
    "/tags/secret",
  ]) {
    const response = await exports.default.fetch(`https://saad.sh${path}`);
    const body = await response.text();
    expect(body).not.toContain("get-complete-file-path");
    expect(body).not.toContain("PRIVATE_SECURITY_MARKER");
  }
});

it("escapes script boundaries and uses the shared card despite a custom post image", async () => {
  const response = await exports.default.fetch("https://saad.sh/posts/git-undo-last-commit");
  expect(response.status).toBe(200);
  const html = await response.text();
  expect(html).not.toContain("</script><script>globalThis.__reviewXss=1</script>");
  const structuredData = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1];
  expect(structuredData).toBeDefined();
  expect(JSON.parse(structuredData!)["@graph"][0].headline).toBe(
    "</script><script>globalThis.__reviewXss=1</script>",
  );
  expect(html).toContain('property="og:image" content="https://saad.sh/og/site.png"');
  expect(html).toContain('"image":["https://saad.sh/og/site.png"]');
});

it.each([
  "/admin",
  "/admin/login",
  "/admin/enroll",
  "/admin/settings",
  "/admin/posts/subagents-in-practice",
  "/admin/api/auth/options",
  "/admin/api/auth/verify",
  "/admin/api/auth/logout",
  "/admin/api/posts",
  "/admin/api/credentials",
  "/admin/api/preview",
  "/admin/api/posts/example",
  "/admin/api/posts/example/action",
])("removes %s", async (path) => {
  for (const method of ["GET", "HEAD", "POST", "DELETE"]) {
    const response = await exports.default.fetch(`https://saad.sh${path}`, {
      method,
      redirect: "manual",
    });
    expect(response.status).toBe(404);
    expect(response.headers.get("location")).toBeNull();
  }
});

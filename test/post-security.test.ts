import { exports } from "cloudflare:workers";
import { beforeAll, expect, it } from "vitest";
import { toJSONAsync, fromCrossJSON } from "seroval";
import { createPost, saveDraft, publishPost } from "#/lib/admin-posts";
import { PREVIEW_HEADERS, signPreviewToken } from "#/lib/preview";
import { loadPostData } from "#/routes/posts.$slug";
import { seedContent } from "./seed";

const slug = "security-private-draft";
const maliciousText = "</script><script>globalThis.__reviewXss=1</script>";

beforeAll(async () => {
  await seedContent();
  await createPost(slug, "Private draft");
  await saveDraft(slug, {
    title: maliciousText,
    description: maliciousText,
    date: "2026-09-14",
    tags: [maliciousText],
    image: null,
    body: "PRIVATE_SECURITY_MARKER",
  });
});

function expectPrivate(headers: Headers) {
  for (const [name, value] of Object.entries(PREVIEW_HEADERS))
    expect(headers.get(name)).toBe(value);
}

it("escapes script boundaries in metadata on previews and published pages", async () => {
  const token = await signPreviewToken(slug);
  const preview = await exports.default.fetch(
    `https://saad.sh/posts/${slug}?preview=${encodeURIComponent(token)}`,
  );
  expect(preview.status).toBe(200);
  expectPrivate(preview.headers);
  const previewHtml = await preview.text();
  expect(previewHtml).not.toContain(maliciousText);
  const structuredData = previewHtml.match(
    /<script type="application\/ld\+json">(.*?)<\/script>/s,
  )?.[1];
  expect(structuredData).toBeDefined();
  const jsonLd = JSON.parse(structuredData!);
  expect(jsonLd["@graph"][0].headline).toBe(maliciousText);
  expect(jsonLd["@graph"][0].description).toBe(maliciousText);
  expect(jsonLd["@graph"][0].keywords).toBe(maliciousText);

  await publishPost(slug);
  const published = await exports.default.fetch(`https://saad.sh/posts/${slug}`);
  expect(published.status).toBe(200);
  expect(await published.text()).not.toContain(maliciousText);
  // Keep a draft distinct from the now-public content for the RPC tests.
  await saveDraft(slug, {
    title: "Private draft",
    description: "",
    date: "2026-09-14",
    tags: [],
    image: null,
    body: "RPC_PRIVATE_MARKER",
  });
});

it("protects preview redirects and invalid-token responses", async () => {
  for (const [path, status] of [
    [`/posts/${slug}/?preview=invalid`, 301],
    [`/posts/${slug}?preview=invalid`, 404],
  ] as const) {
    const response = await exports.default.fetch(`https://saad.sh${path}`, { redirect: "manual" });
    expect(response.status).toBe(status);
    expectPrivate(response.headers);
    expect(await response.text()).not.toContain("RPC_PRIVATE_MARKER");
  }
});

it("protects preview RPC responses when the token is nested inside payload", async () => {
  for (const { preview, allowed } of [
    { preview: await signPreviewToken(slug), allowed: true },
    { preview: "invalid", allowed: false },
    { preview: await signPreviewToken("different-slug"), allowed: false },
  ]) {
    const requestUrl = new URL(loadPostData.url, "https://saad.sh");
    requestUrl.searchParams.set(
      "payload",
      JSON.stringify(await toJSONAsync({ data: { slug, preview } })),
    );
    expect(requestUrl.searchParams.has("preview")).toBe(false);
    const response = await exports.default.fetch(requestUrl.toString(), {
      headers: { Origin: "https://saad.sh", "x-tsr-serverFn": "true", Accept: "application/json" },
    });
    expect(response.status, requestUrl.pathname).toBe(200);
    expectPrivate(response.headers);
    // The RPC serializer returns an envelope around this server function's result.
    const envelope = fromCrossJSON(await response.json(), { refs: new Map() }) as {
      result: Awaited<ReturnType<typeof loadPostData>>;
    };
    const result = envelope.result;
    if (allowed) {
      expect(result?.preview).toBe(true);
      expect(JSON.stringify(result)).toContain("RPC_PRIVATE_MARKER");
    } else {
      expect(result).toBeNull();
    }
  }
});

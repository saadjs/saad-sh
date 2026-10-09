/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { env, exports } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import { seedContent } from "./seed";

describe("Cloudflare Worker", () => {
  beforeAll(async () => {
    await seedContent();
  });

  it("serves Saad's profile as JSON", async () => {
    const response = await exports.default.fetch("https://saad.sh/me");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      status: "building",
      dayJob: "enterprise engineering",
      nightMode: "tools + ideas",
      interests: ["AI Stuff", "CLIs", "automation"],
      programmingLanguages: ["TypeScript", "Python", "Go", "Swift"],
      livesBy: "Always building, always learning",
      links: {
        website: "https://saad.sh",
        linkedin: "https://linkedin.com/in/saadbash",
      },
    });
  });

  it("serves robots.txt from the Worker runtime", async () => {
    const response = await exports.default.fetch("https://saad.sh/robots.txt");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    await expect(response.text()).resolves.toContain("Sitemap: https://saad.sh/sitemap.xml");
  });

  it("serves the post archive", async () => {
    const response = await exports.default.fetch("https://saad.sh/posts");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    await expect(response.text()).resolves.toContain("All writing.");
  });

  it("serves llms.txt with markdown links for every post", async () => {
    const response = await exports.default.fetch("https://saad.sh/llms.txt");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    await expect(response.text()).resolves.toContain(
      "https://saad.sh/posts/subagents-in-practice.md",
    );
  });

  it("serves a post as raw markdown", async () => {
    const response = await exports.default.fetch("https://saad.sh/posts/subagents-in-practice.md");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/markdown");

    const body = await response.text();
    expect(body).toContain("# Subagents: How They Work and When to Use Them");
    expect(body).toContain("Source: https://saad.sh/posts/subagents-in-practice");
    expect(body).not.toContain("export const metadata");
  });

  it("404s markdown for an unknown post", async () => {
    const response = await exports.default.fetch("https://saad.sh/posts/does-not-exist.md");

    expect(response.status).toBe(404);
  });

  it.each(["/", "/about", "/projects", "/posts/subagents-in-practice"])(
    "uses the shared card in social metadata for %s",
    async (path) => {
      const response = await exports.default.fetch(`https://saad.sh${path}`);
      expect(response.status).toBe(200);
      const html = await response.text();
      for (const attribute of ['property="og:image"', 'name="twitter:image"']) {
        const images = [...html.matchAll(new RegExp(`<meta ${attribute} content="([^"]+)"`, "g"))];
        expect(images.length).toBeGreaterThan(0);
        expect(images.map((match) => match[1])).toEqual(
          images.map(() => "https://saad.sh/og/site.png"),
        );
      }
    },
  );

  it("uses the shared card even when a published post has a custom image", async () => {
    await env.CONTENT_DB.prepare(
      `INSERT INTO posts (slug, title, date, image, published, body, created_at, updated_at)
       VALUES ('custom-image-post', 'Custom image post', '2026-10-08', '/custom.png', 1, '', ?, ?)`,
    )
      .bind(new Date().toISOString(), new Date().toISOString())
      .run();
    const response = await exports.default.fetch("https://saad.sh/posts/custom-image-post");
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('property="og:image" content="https://saad.sh/og/site.png"');
    expect(html).toContain('"image":["https://saad.sh/og/site.png"]');
    expect(html).toContain('name="twitter:image" content="https://saad.sh/og/site.png"');
  });

  it("redirects legacy opengraph-image URLs to the shared site card", async () => {
    const site = await exports.default.fetch("https://saad.sh/opengraph-image", {
      redirect: "manual",
    });
    expect(site.status).toBe(301);
    expect(site.headers.get("location")).toBe("/og/site.png");

    const post = await exports.default.fetch(
      "https://saad.sh/posts/subagents-in-practice/opengraph-image",
      { redirect: "manual" },
    );
    expect(post.status).toBe(301);
    expect(post.headers.get("location")).toBe("https://saad.sh/og/site.png");
  });

  it("uses the shared card for new posts without a deployment", async () => {
    const response = await exports.default.fetch(
      "https://saad.sh/posts/new-web-post/opengraph-image",
      { redirect: "manual" },
    );
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://saad.sh/og/site.png");
  });

  it("redirects saadbash.com to saad.sh", async () => {
    const response = await exports.default.fetch("https://saadbash.com/posts/foo", {
      redirect: "manual",
    });

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://saad.sh/posts/foo");
  });

  it("strips trailing slashes", async () => {
    const response = await exports.default.fetch("https://saad.sh/posts/foo/", {
      redirect: "manual",
    });

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://saad.sh/posts/foo");
  });
});

/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("Cloudflare Worker", () => {
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
    await expect(response.text()).resolves.toContain("All posts");
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

  it("redirects legacy opengraph-image URLs to the static cards", async () => {
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
    expect(post.headers.get("location")).toBe("/og/subagents-in-practice.png");
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

/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("Cloudflare Worker", () => {
  it("serves robots.txt from the Worker runtime", async () => {
    const response = await exports.default.fetch("https://saad.sh/robots.txt");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    await expect(response.text()).resolves.toContain("Sitemap: https://saad.sh/sitemap.xml");
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

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
});

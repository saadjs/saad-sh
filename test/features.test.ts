/// <reference types="@cloudflare/vitest-pool-workers/types" />

import worker from "#/server";
import { env, exports, withEnv } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { newsletterEnabled } from "#/lib/features.server";

describe("newsletter feature flag", () => {
  it.each([undefined, "false", "", "TRUE", "1", "true"])(
    "only enables signup for the exact string true (%s)",
    (value) => {
      withEnv({ ...env, NEWSLETTER_ENABLED: value }, () => {
        expect(newsletterEnabled()).toBe(value === "true");
      });
    },
  );

  it("restores newsletter pages, navigation, discovery, and input validation when enabled", async () => {
    await withEnv({ ...env, NEWSLETTER_ENABLED: "true" }, async () => {
      const fetch = (path: string, init?: RequestInit) =>
        worker.fetch(new Request(`https://saad.sh${path}`, init));
      const page = await fetch("/newsletter");
      expect(page.status).toBe(200);
      expect(await page.text()).toMatch(/href="\/newsletter\/?"/);
      for (const path of ["/sitemap.xml", "/llms.txt"]) {
        const response = await fetch(path);
        expect(await response.text()).toContain("https://saad.sh/newsletter");
      }
      const subscribe = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        body: "not-json",
      });
      expect(subscribe.status).toBe(400);
      expect(await subscribe.json()).toEqual({ ok: false, error: "invalid_email" });
      const confirm = await fetch("/newsletter/confirm?token=invalid");
      expect(confirm.status).toBe(200);
    });
  });

  it("hides newsletter navigation and discovery when disabled", async () => {
    const page = await exports.default.fetch("https://saad.sh/posts");
    expect(page.status).toBe(200);
    expect(await page.text()).not.toMatch(/href="\/newsletter\/?"/);
    for (const path of ["/sitemap.xml", "/llms.txt"]) {
      const response = await exports.default.fetch(`https://saad.sh${path}`);
      expect(response.status).toBe(200);
      expect(await response.text()).not.toContain("https://saad.sh/newsletter");
    }
  });

  it.each(["/newsletter", "/newsletter/confirm?token=old-token"])(
    "blocks direct access to %s when disabled",
    async (path) => {
      const response = await exports.default.fetch(`https://saad.sh${path}`);
      expect(response.status).toBe(404);
      expect(await response.text()).not.toContain('placeholder="you@example.com"');
    },
  );

  it("rejects signup before parsing input or contacting external services", async () => {
    const response = await exports.default.fetch("https://saad.sh/api/newsletter/subscribe", {
      method: "POST",
      body: "not-json",
    });
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: false, error: "newsletter_disabled" });
  });
});

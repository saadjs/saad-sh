/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import {
  claimEnrollmentToken,
  createEnrollmentToken,
  createSession,
  getSession,
  enrollmentTokenValid,
  hasValidOrigin,
  isValidSlug,
  allowLoginChallenge,
  storeChallenge,
  claimChallenge,
} from "#/lib/admin-auth";
import { hashToken } from "#/lib/crypto";
import {
  commitPublication,
  createPost,
  getAdminPost,
  publishPost,
  saveDraft,
  deletePost,
} from "#/lib/admin-posts";
import { renderMarkdown } from "#/lib/markdown";
import { counterIsValid } from "#/lib/webauthn";
import { seedContent } from "./seed";

beforeAll(async () => {
  await seedContent();
});

it("saves drafts in place and publishes without a revision table", async () => {
  const slug = "no-history-test";
  const initial = {
    title: "Original",
    description: "",
    date: "2026-09-14",
    tags: [],
    image: null,
    body: "Original body",
  };
  await createPost(slug, initial.title);
  await saveDraft(slug, initial);
  expect(await publishPost(slug)).toBe("published");

  await saveDraft(slug, { ...initial, body: "First edit" });
  await saveDraft(slug, { ...initial, body: "Latest edit" });
  const editing = await getAdminPost(slug);
  expect(editing?.live.body).toBe("Original body");
  expect(editing?.draft?.body).toBe("Latest edit");

  expect(await publishPost(slug)).toBe("published");
  const published = await getAdminPost(slug);
  expect(published?.live.body).toBe("Latest edit");
  expect(published?.draft).toBeNull();
  expect(
    await env.CONTENT_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'post_revisions'",
    ).first(),
  ).toBeNull();
});

describe("admin gate", () => {
  it("hides every admin surface from an unauthenticated caller", async () => {
    for (const path of [
      "/admin",
      "/admin/posts/subagents-in-practice",
      "/admin/api/posts",
      "/admin/api/preview",
      "/admin/api/posts/anything/action",
    ]) {
      const response = await exports.default.fetch(`https://saad.sh${path}`);
      expect(response.status, path).toBe(404);
    }
  });

  it("answers 404 rather than 401, so the surface is not advertised", async () => {
    const response = await exports.default.fetch("https://saad.sh/admin");
    expect(response.status).toBe(404);
    expect(response.headers.get("WWW-Authenticate")).toBeNull();
    expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
  });

  it("serves the sign-in page, which is the only way to get a session", async () => {
    const response = await exports.default.fetch("https://saad.sh/admin/login");
    expect(response.status).toBe(200);
  });

  it("does not exist at all on the non-canonical hosts the worker also serves", async () => {
    const response = await exports.default.fetch("https://saadbash.dev/admin/login");
    expect(response.status).toBe(404);
  });

  it("leaves the public site reachable", async () => {
    const response = await exports.default.fetch("https://saad.sh/posts");
    expect(response.status).toBe(200);
  });
});

describe("CSRF origin check", () => {
  function post(headers: Record<string, string>): Request {
    return new Request("https://saad.sh/admin/api/posts", { method: "POST", headers });
  }

  it("accepts a same-origin mutation", () => {
    expect(hasValidOrigin(post({ Origin: "https://saad.sh" }))).toBe(true);
  });

  it("refuses a cross-origin mutation", () => {
    expect(hasValidOrigin(post({ Origin: "https://evil.example" }))).toBe(false);
  });

  it("refuses a matching host with a different scheme", () => {
    expect(hasValidOrigin(post({ Origin: "http://saad.sh" }))).toBe(false);
  });

  it("refuses a mutation with no Origin at all", () => {
    expect(hasValidOrigin(post({}))).toBe(false);
  });
});

describe("enrollment tokens", () => {
  it("validates without spending, so a cancelled prompt costs nothing", async () => {
    const token = await createEnrollmentToken();
    expect(await enrollmentTokenValid(token)).toBe(true);
    expect(await enrollmentTokenValid(token)).toBe(true);
  });

  it("can only be claimed once", async () => {
    const token = await createEnrollmentToken();
    expect(await claimEnrollmentToken(token)).toBe(true);
    expect(await claimEnrollmentToken(token)).toBe(false);
  });

  it("refuses a token that does not match a stored hash", async () => {
    expect(await claimEnrollmentToken("not-a-real-token")).toBe(false);
    expect(await enrollmentTokenValid("")).toBe(false);
  });

  it("refuses an expired token", async () => {
    const token = await createEnrollmentToken();
    await env.CONTENT_DB.prepare("UPDATE enrollment_tokens SET expires_at = ? WHERE token_hash = ?")
      .bind(new Date(Date.now() - 1000).toISOString(), await hashToken(token))
      .run();

    expect(await enrollmentTokenValid(token)).toBe(false);
    expect(await claimEnrollmentToken(token)).toBe(false);
  });

  it("stores only the hash, never the token", async () => {
    const token = await createEnrollmentToken();
    const row = await env.CONTENT_DB.prepare(
      "SELECT COUNT(*) AS hits FROM enrollment_tokens WHERE token_hash = ?",
    )
      .bind(token)
      .first<{ hits: number }>();
    expect(row?.hits).toBe(0);
  });
});

describe("passkey signature counter", () => {
  it("accepts a synced authenticator that always reports zero", () => {
    expect(counterIsValid(0, 0)).toBe(true);
  });

  it("still requires a real counter to move forward once it has been seen", () => {
    expect(counterIsValid(5, 6)).toBe(true);
    expect(counterIsValid(5, 5)).toBe(false);
    expect(counterIsValid(5, 4)).toBe(false);
  });
});

describe("slug validation", () => {
  it("accepts the shapes posts actually use", () => {
    expect(isValidSlug("subagents-in-practice")).toBe(true);
    expect(isValidSlug("python-3-tips")).toBe(true);
  });

  it("refuses anything that would escape the posts namespace", () => {
    for (const slug of ["../secrets", "a/b", "Upper", "trailing-", "-leading", "", "a--b", "a b"]) {
      expect(isValidSlug(slug), slug).toBe(false);
    }
  });
});

describe("publication concurrency", () => {
  it("keeps a newer draft and the live post when the rendered snapshot is stale", async () => {
    const slug = "concurrent-publish";
    await createPost(slug, "Original");
    expect(await publishPost(slug)).toBe("published");
    const live = await getAdminPost(slug);
    if (!live) throw new Error("Missing fixture");
    await saveDraft(slug, { ...live.live, body: "Snapshot to publish" });
    const snapshot = await getAdminPost(slug);
    if (!snapshot?.draft) throw new Error("Missing draft");
    const tree = await renderMarkdown(snapshot.draft.body);

    await saveDraft(slug, { ...snapshot.draft, body: "Newer edit" });
    expect(await commitPublication(snapshot, tree)).toBe("conflict");
    const after = await getAdminPost(slug);
    expect(after?.live.body).toBe(live.live.body);
    expect(after?.draft?.body).toBe("Newer edit");
    expect(await publishPost(slug)).toBe("published");
    expect((await getAdminPost(slug))?.draft).toBeNull();
    expect((await getAdminPost(slug))?.live.body).toBe("Newer edit");
  });

  it("does not consume a draft created while republishing a live post", async () => {
    const slug = "concurrent-new-draft";
    await createPost(slug, "Original");
    await publishPost(slug);
    const snapshot = await getAdminPost(slug);
    if (!snapshot) throw new Error("Missing fixture");
    const tree = await renderMarkdown(snapshot.live.body);
    await saveDraft(slug, { ...snapshot.live, body: "New draft" });
    expect(await commitPublication(snapshot, tree)).toBe("conflict");
    expect((await getAdminPost(slug))?.draft?.body).toBe("New draft");
  });

  it("does not publish a post deleted while rendering", async () => {
    const slug = "concurrent-delete";
    await createPost(slug, "Original");
    const snapshot = await getAdminPost(slug);
    if (!snapshot?.draft) throw new Error("Missing fixture");
    const tree = await renderMarkdown(snapshot.draft.body);
    await deletePost(slug);
    expect(await commitPublication(snapshot, tree)).toBe("conflict");
    expect(await getAdminPost(slug)).toBeNull();
  });
});

it("rejects existing sessions after recovery deletes their credential", async () => {
  const id = "recovery-test-credential";
  await env.CONTENT_DB.prepare(
    "INSERT INTO credentials (id, public_key, created_at) VALUES (?, ?, ?)",
  )
    .bind(id, "test-key", new Date().toISOString())
    .run();
  const { cookie } = await createSession(id, new Request("https://saad.sh/admin"));
  const request = new Request("https://saad.sh/admin", {
    headers: { Cookie: cookie.split(";")[0] },
  });
  expect(await getSession(request)).not.toBeNull();
  await env.CONTENT_DB.prepare("DELETE FROM credentials WHERE id = ?").bind(id).run();
  expect(await getSession(request)).toBeNull();
  const response = await exports.default.fetch(request);
  expect(response.status).toBe(404);
});

describe("login challenge admission", () => {
  it("limits concurrent anonymous requests even when none attempt verification", async () => {
    await env.CONTENT_DB.prepare(
      "INSERT INTO credentials (id, public_key, created_at) VALUES ('rate-limit-key', 'fixture', ?)",
    )
      .bind(new Date().toISOString())
      .run();
    try {
      const responses = await Promise.all(
        Array.from({ length: 15 }, () =>
          exports.default.fetch("https://saad.sh/admin/api/auth/options", {
            method: "POST",
            headers: {
              Origin: "https://saad.sh",
              "Content-Type": "application/json",
              "CF-Connecting-IP": "192.0.2.10",
            },
            body: JSON.stringify({ mode: "login" }),
          }),
        ),
      );
      expect(responses.filter((response) => response.status === 200)).toHaveLength(10);
      expect(responses.filter((response) => response.status === 429)).toHaveLength(5);
      const challenges: string[] = [];
      for (const response of responses) {
        const body = (await response.json()) as { challenge?: string };
        if (body.challenge) challenges.push(body.challenge);
      }
      expect(new Set(challenges).size).toBe(10);
      for (const challenge of challenges)
        expect(await claimChallenge(challenge, "authenticate")).toBe(true);
    } finally {
      await env.CONTENT_DB.prepare("DELETE FROM credentials WHERE id = 'rate-limit-key'").run();
    }
  });

  it("expires buckets and retains independent limits for other IPs", async () => {
    const request = new Request("https://saad.sh/admin/api/auth/options", {
      headers: { "CF-Connecting-IP": "192.0.2.11" },
    });
    for (let i = 0; i < 10; i++) expect(await allowLoginChallenge(request)).toBe(true);
    expect(await allowLoginChallenge(request)).toBe(false);
    expect(
      await allowLoginChallenge(
        new Request(request, { headers: { "CF-Connecting-IP": "192.0.2.12" } }),
      ),
    ).toBe(true);
    await env.CONTENT_DB.prepare("UPDATE login_rate_limits SET expires_at = ? WHERE ip = ?")
      .bind(Date.now() - 1, "192.0.2.11")
      .run();
    expect(await allowLoginChallenge(request)).toBe(true);
    const bucket = await env.CONTENT_DB.prepare(
      "SELECT attempts FROM login_rate_limits WHERE ip = ?",
    )
      .bind("192.0.2.11")
      .first<{ attempts: number }>();
    expect(bucket?.attempts).toBe(1);
  });

  it("shares a bounded bucket when Cloudflare's IP header is absent", async () => {
    const request = new Request("http://localhost:3000/admin/api/auth/options");
    for (let i = 0; i < 10; i++) expect(await allowLoginChallenge(request)).toBe(true);
    expect(await allowLoginChallenge(request)).toBe(false);
  });

  it("cleans expired challenges while retaining valid single-use challenges", async () => {
    await storeChallenge("expired-review-challenge", "authenticate");
    await env.CONTENT_DB.prepare("UPDATE auth_challenges SET expires_at = ? WHERE challenge = ?")
      .bind(new Date(Date.now() - 1).toISOString(), "expired-review-challenge")
      .run();
    await storeChallenge("live-review-challenge", "authenticate");
    expect(
      await env.CONTENT_DB.prepare("SELECT 1 FROM auth_challenges WHERE challenge = ?")
        .bind("expired-review-challenge")
        .first(),
    ).toBeNull();
    expect(await claimChallenge("live-review-challenge", "authenticate")).toBe(true);
    expect(await claimChallenge("live-review-challenge", "authenticate")).toBe(false);
  });
});

describe("passkey removal", () => {
  it("preserves one credential and its session during concurrent removals", async () => {
    // This file's earlier credential fixtures are removed by their own tests.
    expect(
      (
        await env.CONTENT_DB.prepare("SELECT COUNT(*) AS total FROM credentials").first<{
          total: number;
        }>()
      )?.total,
    ).toBe(0);
    const ids = ["revoke-a", "revoke-b"];
    const cookies: string[] = [];
    for (const id of ids) {
      await env.CONTENT_DB.prepare(
        "INSERT INTO credentials (id, public_key, created_at) VALUES (?, 'fixture', ?)",
      )
        .bind(id, new Date().toISOString())
        .run();
      cookies.push(
        (await createSession(id, new Request("https://saad.sh/admin"))).cookie.split(";")[0],
      );
    }
    const requests = ids.map(
      (id, i) =>
        new Request("https://saad.sh/admin/api/credentials", {
          method: "DELETE",
          headers: {
            Cookie: cookies[i],
            Origin: "https://saad.sh",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }),
    );
    const responses = await Promise.all(requests.map((request) => exports.default.fetch(request)));
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    await Promise.all(responses.map((response) => response.text()));
    const remaining = await env.CONTENT_DB.prepare("SELECT id FROM credentials").all<{
      id: string;
    }>();
    expect(remaining.results).toHaveLength(1);
    const survivor = ids.indexOf(remaining.results[0].id);
    expect(
      await getSession(
        new Request("https://saad.sh/admin", { headers: { Cookie: cookies[survivor] } }),
      ),
    ).not.toBeNull();
    expect(
      await getSession(
        new Request("https://saad.sh/admin", { headers: { Cookie: cookies[1 - survivor] } }),
      ),
    ).toBeNull();
    const last = await exports.default.fetch("https://saad.sh/admin/api/credentials", {
      method: "DELETE",
      headers: {
        Cookie: cookies[survivor],
        Origin: "https://saad.sh",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: ids[survivor] }),
    });
    expect(last.status).toBe(409);
    expect(await last.json()).toEqual({ error: "last_credential" });
    await env.CONTENT_DB.prepare(
      "DELETE FROM credentials WHERE id IN ('revoke-a', 'revoke-b')",
    ).run();
  });
});

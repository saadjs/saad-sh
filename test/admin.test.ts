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

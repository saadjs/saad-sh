/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { describe, expect, it } from "vitest";
import {
  claimToken,
  hashToken,
  recordConsent,
  releaseToken,
  signToken,
  verifyToken,
} from "#/lib/newsletter";

const SECRET = "test-signing-secret-please-ignore";
const EMAIL = "reader@example.com";

describe("newsletter token", () => {
  it("round-trips sign -> verify and returns the email", async () => {
    const token = await signToken(EMAIL, SECRET);
    const result = await verifyToken(token, SECRET);

    expect(result.status).toBe("valid");
    if (result.status === "valid") expect(result.email).toBe(EMAIL);
  });

  it("rejects a tampered payload as invalid", async () => {
    const token = await signToken(EMAIL, SECRET);
    const [, signature] = token.split(".");
    // Swap in a different (validly-encoded) payload while keeping the signature.
    const forgedPayload = btoa(
      JSON.stringify({ email: "attacker@example.com", exp: Date.now() + 1000 }),
    )
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");

    const result = await verifyToken(`${forgedPayload}.${signature}`, SECRET);
    expect(result.status).toBe("invalid");
  });

  it("rejects a tampered signature as invalid", async () => {
    const token = await signToken(EMAIL, SECRET);
    const [payload, signature] = token.split(".");
    const flipped = (signature[0] === "A" ? "B" : "A") + signature.slice(1);

    const result = await verifyToken(`${payload}.${flipped}`, SECRET);
    expect(result.status).toBe("invalid");
  });

  it("rejects a truncated signature as invalid", async () => {
    const token = await signToken(EMAIL, SECRET);
    const [payload, signature] = token.split(".");

    const result = await verifyToken(`${payload}.${signature.slice(0, 10)}`, SECRET);
    expect(result.status).toBe("invalid");
  });

  it("rejects verification with the wrong secret", async () => {
    const token = await signToken(EMAIL, SECRET);
    const result = await verifyToken(token, "a-different-secret");
    expect(result.status).toBe("invalid");
  });

  it("reports an expired token as expired (only after a valid signature)", async () => {
    const token = await signToken(EMAIL, SECRET, -1000);
    const result = await verifyToken(token, SECRET);
    expect(result.status).toBe("expired");
  });

  it("treats garbage strings as invalid", async () => {
    for (const garbage of ["", "not-a-token", "a.b.c", ".", "onlyonepart", "%%%.$$$"]) {
      const result = await verifyToken(garbage, SECRET);
      expect(result.status).toBe("invalid");
    }
  });

  it("returns the exp alongside the email on a valid token", async () => {
    const before = Date.now();
    const token = await signToken(EMAIL, SECRET);
    const result = await verifyToken(token, SECRET);

    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      expect(result.exp).toBeGreaterThan(before);
    }
  });
});

/**
 * Minimal in-memory stand-in for the D1 binding. Records the SQL and bindings
 * it was handed, and emulates `INSERT OR IGNORE` on a primary key so the
 * single-use token claim can be exercised without a real database.
 *
 * Cast rather than fully implemented: `D1Database` is a wide interface and
 * these tests only ever reach `prepare().bind().run()`.
 */
function fakeDb() {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const usedTokenHashes = new Set<string>();

  const db = {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async run() {
              calls.push({ sql, values });
              if (sql.includes("INSERT OR IGNORE INTO used_tokens")) {
                const hash = values[0] as string;
                if (usedTokenHashes.has(hash)) return { meta: { changes: 0 } };
                usedTokenHashes.add(hash);
                return { meta: { changes: 1 } };
              }
              if (sql.includes("DELETE FROM used_tokens")) {
                const hash = values[0] as string;
                return { meta: { changes: usedTokenHashes.delete(hash) ? 1 : 0 } };
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  } as unknown as D1Database;

  return { db, calls };
}

describe("single-use token claim", () => {
  it("grants the first claim and refuses the second", async () => {
    const { db } = fakeDb();
    const token = await signToken(EMAIL, SECRET);
    const exp = Date.now() + 1000;

    expect(await claimToken(db, token, exp)).toBe(true);
    expect(await claimToken(db, token, exp)).toBe(false);
  });

  it("treats distinct tokens as independent claims", async () => {
    const { db } = fakeDb();
    const exp = Date.now() + 1000;
    const first = await signToken(EMAIL, SECRET);
    const second = await signToken("other@example.com", SECRET);

    expect(await claimToken(db, first, exp)).toBe(true);
    expect(await claimToken(db, second, exp)).toBe(true);
  });

  it("makes the token claimable again after a release", async () => {
    const { db } = fakeDb();
    const token = await signToken(EMAIL, SECRET);
    const exp = Date.now() + 1000;

    expect(await claimToken(db, token, exp)).toBe(true);
    // Stands in for a failed upsertContact: the guarded write never happened.
    await releaseToken(db, token);

    // Without the release this would be false, and the subscriber would be
    // told "already a member" while their address stayed unsubscribed.
    expect(await claimToken(db, token, exp)).toBe(true);
  });

  it("releases only the named token, leaving other claims intact", async () => {
    const { db } = fakeDb();
    const exp = Date.now() + 1000;
    const mine = await signToken(EMAIL, SECRET);
    const theirs = await signToken("other@example.com", SECRET);

    await claimToken(db, mine, exp);
    await claimToken(db, theirs, exp);
    await releaseToken(db, mine);

    expect(await claimToken(db, mine, exp)).toBe(true);
    expect(await claimToken(db, theirs, exp)).toBe(false);
  });

  it("targets the release by hash, never the raw token", async () => {
    const { db, calls } = fakeDb();
    const token = await signToken(EMAIL, SECRET);

    await releaseToken(db, token);

    const call = calls[0];
    expect(call?.sql).toContain("DELETE FROM used_tokens");
    expect(call?.values[0]).toBe(await hashToken(token));
    expect(call?.values[0]).not.toBe(token);
  });

  it("persists a hash, never the raw token", async () => {
    const { db, calls } = fakeDb();
    const token = await signToken(EMAIL, SECRET);

    await claimToken(db, token, Date.now() + 1000);

    const stored = calls[0]?.values[0] as string;
    expect(stored).toBe(await hashToken(token));
    expect(stored).not.toBe(token);
    expect(stored).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("consent record", () => {
  it("writes the email, context, and both timestamps", async () => {
    const { db, calls } = fakeDb();
    const exp = Date.now() + 1000;

    await recordConsent(db, EMAIL, exp, {
      ip: "203.0.113.7",
      userAgent: "Mozilla/5.0",
      country: "US",
    });

    const call = calls[0];
    expect(call?.sql).toContain("INSERT INTO consent_records");
    expect(call?.values[0]).toBe(EMAIL);
    expect(call?.values[2]).toBe("203.0.113.7");
    expect(call?.values[3]).toBe("Mozilla/5.0");
    expect(call?.values[4]).toBe("US");
    // confirmed_at and token_issued_at are both ISO-8601.
    expect(call?.values[1]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(call?.values[5]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("stores nulls rather than undefined when context is missing", async () => {
    const { db, calls } = fakeDb();

    await recordConsent(db, EMAIL, Date.now() + 1000, {});

    const call = calls[0];
    expect(call?.values[2]).toBeNull();
    expect(call?.values[3]).toBeNull();
    expect(call?.values[4]).toBeNull();
  });
});

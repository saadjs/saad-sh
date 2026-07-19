/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildSignupNotification,
  claimToken,
  hashToken,
  recordConsent,
  releaseToken,
  sendSignupNotification,
  signToken,
  upsertContact,
  verifyToken,
} from "#/lib/newsletter";

const SECRET = "test-signing-secret-please-ignore";
const EMAIL = "reader@example.com";
const TTL_MS = 48 * 60 * 60 * 1000;

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

/** An `exp` for a token issued `agoMs` ago, matching how signToken builds it. */
function expIssuedAgo(now: number, agoMs: number): number {
  return now - agoMs + TTL_MS;
}

describe("contact upsert outcome", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const AUDIENCE = "aud_test";

  /** Stubs the initial getContact lookup; every later call resolves 200. */
  function stubResend(lookup: Response) {
    let first = true;
    return vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      if (first) {
        first = false;
        return lookup;
      }
      return new Response("{}", { status: 200 });
    });
  }

  it("reports an already-subscribed contact as already-active, writing nothing", async () => {
    const fetchMock = stubResend(
      new Response(JSON.stringify({ id: "c_1", unsubscribed: false }), { status: 200 }),
    );

    expect(await upsertContact(AUDIENCE, EMAIL)).toBe("already-active");
    // Lookup only. A PATCH here would be a no-op, and calling the result
    // "reactivated" would invent a resubscription that never happened.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports an unsubscribed contact as reactivated and clears the flag", async () => {
    const fetchMock = stubResend(
      new Response(JSON.stringify({ id: "c_1", unsubscribed: true }), { status: 200 }),
    );

    expect(await upsertContact(AUDIENCE, EMAIL)).toBe("reactivated");

    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ unsubscribed: false });
  });

  it("reports an unknown address as created", async () => {
    const fetchMock = stubResend(new Response("", { status: 404 }));

    expect(await upsertContact(AUDIENCE, EMAIL)).toBe("created");

    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ email: EMAIL, unsubscribed: false });
  });
});

describe("signup notification wording", () => {
  const NOW = Date.UTC(2026, 6, 19, 12, 0, 0);

  const base = {
    email: EMAIL,
    outcome: "created" as const,
    exp: expIssuedAgo(NOW, 5 * 60 * 1000),
    country: "US",
    hostname: "saad.sh",
  };

  it("labels a brand new contact as a new subscriber", () => {
    const { subject, text } = buildSignupNotification(base, NOW);

    expect(subject).toBe(`New subscriber: ${EMAIL}`);
    expect(text).toContain(`New subscriber: ${EMAIL}`);
  });

  it("labels a revived contact as a resubscribe", () => {
    const { subject, text } = buildSignupNotification({ ...base, outcome: "reactivated" }, NOW);

    expect(subject).toBe(`Resubscribed: ${EMAIL}`);
    expect(text).toContain(`Resubscribed: ${EMAIL}`);
  });

  it("prefixes [dev] for local and workers.dev hosts", () => {
    const hosts = [
      "localhost",
      "127.0.0.1",
      "app.localhost",
      // Account subdomain and a per-version preview URL. Both are enabled by
      // default, so both can serve this worker.
      "saad-sh.example.workers.dev",
      "1d9668bb-saad-sh.example.workers.dev",
    ];

    for (const hostname of hosts) {
      expect(buildSignupNotification({ ...base, hostname }, NOW).subject).toMatch(/^\[dev\] /);
    }
  });

  it("leaves every production host unprefixed", () => {
    // The worker serves four custom domains and the confirm URL is built from
    // the request origin, so a confirmation can legitimately land on any of them.
    for (const hostname of ["saad.sh", "saadbash.com", "saadbash.dev", "www.saadbash.dev"]) {
      const { subject, text } = buildSignupNotification({ ...base, hostname }, NOW);
      expect(subject).not.toContain("[dev]");
      expect(text).toContain(hostname);
    }
  });

  it("reports how long the confirmation took", () => {
    const cases: Array<[number, string]> = [
      [20 * 1000, "under a minute"],
      [60 * 1000, "1 minute"],
      [5 * 60 * 1000, "5 minutes"],
      [2 * 60 * 60 * 1000, "2 hours"],
    ];

    for (const [agoMs, expected] of cases) {
      const { text } = buildSignupNotification({ ...base, exp: expIssuedAgo(NOW, agoMs) }, NOW);
      expect(text).toContain(`Confirmed: ${expected} after signing up`);
    }
  });

  it("says unknown rather than dropping the country line", () => {
    const { text } = buildSignupNotification({ ...base, country: undefined }, NOW);
    expect(text).toContain("Country: unknown");
  });

  it("pads no labels, since proportional fonts cannot align them", () => {
    const { text } = buildSignupNotification(base, NOW);
    // Space-padded columns look aligned in a monospace editor and ragged in
    // every mail client. One space after the colon, always.
    expect(text).not.toMatch(/: {2,}/);
  });

  it("never leaks the subscriber's IP or user agent", () => {
    // Those live in consent_records on purpose. The notification is a heads-up,
    // not a second copy of the consent evidence.
    const { text } = buildSignupNotification(base, NOW);
    expect(text).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
    expect(text).not.toContain("Mozilla");
  });
});

describe("signup notification delivery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const notification = {
    email: EMAIL,
    outcome: "created" as const,
    exp: Date.now() + TTL_MS,
    country: "US",
    hostname: "saad.sh",
  };

  it("posts a text-only email that replies to the subscriber", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    await sendSignupNotification(notification);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");

    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(["saadbashdev@gmail.com"]);
    expect(body.from).toContain("notify@updates.saad.sh");
    expect(body.reply_to).toBe(EMAIL);
    expect(body.text).toContain(EMAIL);
    // Plain text by choice: this one is read only by me, in one client.
    expect(body.html).toBeUndefined();
  });

  it("throws on a non-2xx so the caller's catch is load-bearing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 500 }));

    await expect(sendSignupNotification(notification)).rejects.toThrow(/500/);
  });
});

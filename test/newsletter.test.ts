/// <reference types="@cloudflare/vitest-pool-workers/types" />

import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "#/lib/newsletter";

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
});

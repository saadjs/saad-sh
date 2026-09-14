import { createFileRoute } from "@tanstack/react-router";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import {
  audit,
  claimChallenge,
  denyUnlessAdmin,
  claimEnrollmentToken,
  createSession,
  hasValidOrigin,
  json,
  notFound,
  tooManyAttempts,
} from "#/lib/admin-auth";
import { base64urlDecode } from "#/lib/crypto";
import { verifyAuthentication, verifyRegistration } from "#/lib/webauthn";

type Body = {
  mode?: unknown;
  response?: unknown;
  token?: unknown;
  nickname?: unknown;
};

function challengeFrom(response: { response?: { clientDataJSON?: string } }): string | null {
  const clientDataJSON = response.response?.clientDataJSON;
  if (typeof clientDataJSON !== "string") return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(base64urlDecode(clientDataJSON))) as {
      challenge?: unknown;
    };
    return typeof data.challenge === "string" ? data.challenge : null;
  } catch {
    return null;
  }
}

async function handleVerify(request: Request): Promise<Response> {
  if (!hasValidOrigin(request)) return notFound();

  let payload: Body;
  try {
    payload = (await request.json()) as Body;
  } catch {
    return notFound();
  }

  const url = new URL(request.url);
  const response = payload.response as { response?: { clientDataJSON?: string } } | undefined;
  if (!response || typeof response !== "object") return notFound();

  const challenge = challengeFrom(response);
  if (!challenge) return notFound();

  if (payload.mode === "login") {
    if (await tooManyAttempts(request, "login_failed")) {
      return json({ error: "rate_limited" }, 429);
    }
    if (!(await claimChallenge(challenge, "authenticate"))) {
      await audit("login_failed", request, { detail: "unknown or spent challenge" });
      return notFound();
    }

    const credentialId = await verifyAuthentication(
      url,
      response as AuthenticationResponseJSON,
      challenge,
    );
    if (!credentialId) {
      await audit("login_failed", request, { detail: "assertion rejected" });
      return notFound();
    }

    const { cookie } = await createSession(credentialId, request);
    await audit("login", request, { detail: credentialId });
    return json({ ok: true }, 200, { "Set-Cookie": cookie });
  }

  if (payload.mode === "add") {
    const denied = await denyUnlessAdmin(request, true);
    if (denied) return denied;
    if (!(await claimChallenge(challenge, "register"))) return notFound();

    const nickname = typeof payload.nickname === "string" ? payload.nickname : "passkey";
    const added = await verifyRegistration(
      url,
      response as RegistrationResponseJSON,
      challenge,
      nickname,
    );
    if (!added) return notFound();

    await audit("passkey_registered", request, { detail: nickname });
    return json({ ok: true });
  }

  if (payload.mode === "enroll") {
    if (await tooManyAttempts(request, "enroll_failed", 5)) {
      return json({ error: "rate_limited" }, 429);
    }
    if (!(await claimChallenge(challenge, "register"))) {
      await audit("enroll_failed", request, { detail: "unknown or spent challenge" });
      return notFound();
    }

    const token = typeof payload.token === "string" ? payload.token : "";
    if (!(await claimEnrollmentToken(token))) {
      await audit("enroll_failed", request, { detail: "invalid or spent token" });
      return notFound();
    }

    const nickname = typeof payload.nickname === "string" ? payload.nickname : "passkey";
    const registered = await verifyRegistration(
      url,
      response as RegistrationResponseJSON,
      challenge,
      nickname,
    );
    if (!registered) {
      await audit("enroll_failed", request, { detail: "attestation rejected" });
      return notFound();
    }

    await audit("passkey_registered", request, { detail: nickname });
    return json({ ok: true });
  }

  return notFound();
}

function methodNotAllowed(): Response {
  return notFound();
}

export const Route = createFileRoute("/admin/api/auth/verify")({
  server: {
    handlers: {
      POST: ({ request }) => handleVerify(request),
      GET: methodNotAllowed,
      HEAD: methodNotAllowed,
      PUT: methodNotAllowed,
      PATCH: methodNotAllowed,
      DELETE: methodNotAllowed,
    },
  },
});

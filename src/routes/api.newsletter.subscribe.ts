import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { isValidEmail, sendConfirmationEmail, signToken, verifyTurnstile } from "#/lib/newsletter";

type SubscribeBody = {
  email?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleSubscribe(request: Request): Promise<Response> {
  let payload: SubscribeBody;
  try {
    payload = (await request.json()) as SubscribeBody;
  } catch {
    return json({ ok: false, error: "invalid_email" }, 400);
  }

  const website = typeof payload.website === "string" ? payload.website : "";
  // Honeypot: a bot filled the hidden field. Pretend success, do nothing.
  if (website.trim() !== "") {
    return json({ ok: true }, 200);
  }

  const rawEmail = typeof payload.email === "string" ? payload.email : "";
  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return json({ ok: false, error: "invalid_email" }, 400);
  }

  const turnstileToken = typeof payload.turnstileToken === "string" ? payload.turnstileToken : "";
  const remoteIp = request.headers.get("CF-Connecting-IP") ?? undefined;
  const turnstileOk = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, turnstileToken, remoteIp);
  if (!turnstileOk) {
    return json({ ok: false, error: "turnstile" }, 400);
  }

  try {
    // Anti-enumeration: always sign a token and send the confirmation email,
    // even if the contact already exists. The confirm page reveals membership.
    const token = await signToken(email, env.NEWSLETTER_SIGNING_SECRET);
    const origin = new URL(request.url).origin;
    const confirmUrl = `${origin}/newsletter/confirm?token=${encodeURIComponent(token)}`;
    await sendConfirmationEmail(email, confirmUrl);
    return json({ ok: true }, 200);
  } catch (error) {
    console.error("Newsletter subscribe failed", error);
    return json({ ok: false, error: "server" }, 500);
  }
}

function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json", Allow: "POST" },
  });
}

export const Route = createFileRoute("/api/newsletter/subscribe")({
  server: {
    handlers: {
      POST: ({ request }) => handleSubscribe(request),
      // Without these the router falls through and renders the SPA shell with a
      // 200 for any non-POST verb.
      GET: methodNotAllowed,
      HEAD: methodNotAllowed,
      PUT: methodNotAllowed,
      PATCH: methodNotAllowed,
      DELETE: methodNotAllowed,
    },
  },
});

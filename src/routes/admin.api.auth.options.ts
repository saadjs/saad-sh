import { createFileRoute } from "@tanstack/react-router";
import {
  audit,
  denyUnlessAdmin,
  enrollmentTokenValid,
  credentialCount,
  hasValidOrigin,
  json,
  notFound,
  tooManyAttempts,
} from "#/lib/admin-auth";
import { authenticationOptions, registrationOptions } from "#/lib/webauthn";

type Body = { mode?: unknown; token?: unknown };

async function handleOptions(request: Request): Promise<Response> {
  if (!hasValidOrigin(request)) return notFound();

  let payload: Body;
  try {
    payload = (await request.json()) as Body;
  } catch {
    return notFound();
  }

  const url = new URL(request.url);

  if (payload.mode === "login") {
    if (await tooManyAttempts(request, "login_failed")) {
      return json({ error: "rate_limited" }, 429);
    }
    if ((await credentialCount()) === 0) return notFound();
    return json(await authenticationOptions(url));
  }

  if (payload.mode === "add") {
    const denied = await denyUnlessAdmin(request, true);
    if (denied) return denied;
    return json(await registrationOptions(url));
  }

  if (payload.mode === "enroll") {
    if (await tooManyAttempts(request, "enroll_failed", 5)) {
      return json({ error: "rate_limited" }, 429);
    }

    const token = typeof payload.token === "string" ? payload.token : "";
    if (!(await enrollmentTokenValid(token))) {
      await audit("enroll_failed", request, { detail: "invalid or spent token" });
      return notFound();
    }

    return json(await registrationOptions(url));
  }

  return notFound();
}

function methodNotAllowed(): Response {
  return notFound();
}

export const Route = createFileRoute("/admin/api/auth/options")({
  server: {
    handlers: {
      POST: ({ request }) => handleOptions(request),
      GET: methodNotAllowed,
      HEAD: methodNotAllowed,
      PUT: methodNotAllowed,
      PATCH: methodNotAllowed,
      DELETE: methodNotAllowed,
    },
  },
});

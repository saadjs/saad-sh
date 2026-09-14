import { createFileRoute } from "@tanstack/react-router";
import { audit, hasValidOrigin, json, notFound, revokeSession } from "#/lib/admin-auth";

async function handleLogout(request: Request): Promise<Response> {
  if (!hasValidOrigin(request)) return notFound();

  const cookie = await revokeSession(request);
  await audit("logout", request);
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}

function methodNotAllowed(): Response {
  return notFound();
}

export const Route = createFileRoute("/admin/api/auth/logout")({
  server: {
    handlers: {
      POST: ({ request }) => handleLogout(request),
      GET: methodNotAllowed,
      HEAD: methodNotAllowed,
      PUT: methodNotAllowed,
      PATCH: methodNotAllowed,
      DELETE: methodNotAllowed,
    },
  },
});

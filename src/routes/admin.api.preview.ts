import { createFileRoute } from "@tanstack/react-router";
import { denyUnlessAdmin, json, notFound } from "#/lib/admin-auth";
import { renderMarkdown } from "#/lib/markdown";

async function handlePreview(request: Request): Promise<Response> {
  const denied = await denyUnlessAdmin(request, true);
  if (denied) return denied;

  let payload: { body?: unknown };
  try {
    payload = (await request.json()) as { body?: unknown };
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const body = typeof payload.body === "string" ? payload.body : "";
  if (body.length > 500_000) return json({ error: "too_large" }, 413);

  return json({ hast: await renderMarkdown(body) });
}

export const Route = createFileRoute("/admin/api/preview")({
  server: {
    handlers: {
      POST: ({ request }) => handlePreview(request),
      GET: () => notFound(),
      HEAD: () => notFound(),
      PUT: () => notFound(),
      PATCH: () => notFound(),
      DELETE: () => notFound(),
    },
  },
});

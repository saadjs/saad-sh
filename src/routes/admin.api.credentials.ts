import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { audit, denyUnlessAdmin, json, notFound } from "#/lib/admin-auth";

type CredentialSummary = {
  id: string;
  nickname: string;
  createdAt: string;
  lastUsedAt: string | null;
};

async function handleList(request: Request): Promise<Response> {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;

  const { results } = await env.CONTENT_DB.prepare(
    "SELECT id, nickname, created_at, last_used_at FROM credentials ORDER BY created_at",
  ).all<{ id: string; nickname: string; created_at: string; last_used_at: string | null }>();

  const credentials: CredentialSummary[] = results.map((row) => ({
    id: row.id,
    nickname: row.nickname,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  }));

  return json({ credentials });
}

async function handleRevoke(request: Request): Promise<Response> {
  const denied = await denyUnlessAdmin(request, true);
  if (denied) return denied;

  let payload: { id?: unknown };
  try {
    payload = (await request.json()) as { id?: unknown };
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const id = typeof payload.id === "string" ? payload.id : "";
  if (!id) return json({ error: "invalid_id" }, 400);

  const row = await env.CONTENT_DB.prepare("SELECT COUNT(*) AS total FROM credentials").first<{
    total: number;
  }>();
  if ((row?.total ?? 0) <= 1) return json({ error: "last_credential" }, 409);

  const result = await env.CONTENT_DB.prepare("DELETE FROM credentials WHERE id = ?")
    .bind(id)
    .run();
  if (result.meta.changes === 0) return notFound();

  await env.CONTENT_DB.prepare("DELETE FROM sessions WHERE credential_id = ?").bind(id).run();
  await audit("passkey_revoked", request, { detail: id });

  return json({ ok: true });
}

export const Route = createFileRoute("/admin/api/credentials")({
  server: {
    handlers: {
      GET: ({ request }) => handleList(request),
      DELETE: ({ request }) => handleRevoke(request),
      POST: () => notFound(),
      PUT: () => notFound(),
      PATCH: () => notFound(),
      HEAD: () => notFound(),
    },
  },
});

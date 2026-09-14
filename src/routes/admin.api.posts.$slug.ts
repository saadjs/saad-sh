import { createFileRoute } from "@tanstack/react-router";
import { audit, denyUnlessAdmin, isValidSlug, json, notFound } from "#/lib/admin-auth";
import { type PostFields, deletePost, getAdminPost, saveDraft } from "#/lib/admin-posts";

function parseFields(payload: Record<string, unknown>): PostFields | null {
  const { title, description, date, tags, image, body } = payload;
  if (typeof title !== "string" || typeof body !== "string") return null;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) return null;

  return {
    title: title.slice(0, 200),
    description: typeof description === "string" ? description.slice(0, 500) : "",
    date,
    tags: (tags as string[])
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 12),
    image: typeof image === "string" && image ? image.slice(0, 300) : null,
    body,
  };
}

async function handleGet(request: Request, slug: string): Promise<Response> {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  if (!isValidSlug(slug)) return notFound();

  const post = await getAdminPost(slug);
  if (!post) return notFound();

  return json({ post });
}

async function handleSave(request: Request, slug: string): Promise<Response> {
  const denied = await denyUnlessAdmin(request, true);
  if (denied) return denied;
  if (!isValidSlug(slug)) return notFound();
  if (!(await getAdminPost(slug))) return notFound();

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const fields = parseFields(payload);
  if (!fields) return json({ error: "invalid_fields" }, 400);

  await saveDraft(slug, fields);
  if (payload.manual === true) await audit("save", request, { slug });

  return json({ ok: true, savedAt: new Date().toISOString() });
}

async function handleDelete(request: Request, slug: string): Promise<Response> {
  const denied = await denyUnlessAdmin(request, true);
  if (denied) return denied;
  if (!isValidSlug(slug)) return notFound();
  if (!(await getAdminPost(slug))) return notFound();

  await deletePost(slug);
  await audit("delete", request, { slug });
  return json({ ok: true });
}

export const Route = createFileRoute("/admin/api/posts/$slug")({
  server: {
    handlers: {
      GET: ({ request, params }) => handleGet(request, params.slug),
      PATCH: ({ request, params }) => handleSave(request, params.slug),
      DELETE: ({ request, params }) => handleDelete(request, params.slug),
      POST: () => notFound(),
      PUT: () => notFound(),
      HEAD: () => notFound(),
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { audit, denyUnlessAdmin, isValidSlug, json, notFound } from "#/lib/admin-auth";
import { createPost, listAdminPosts, slugExists } from "#/lib/admin-posts";
import { slugifyTag } from "#/lib/utils";

async function handleList(request: Request): Promise<Response> {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  return json({ posts: await listAdminPosts() });
}

async function handleCreate(request: Request): Promise<Response> {
  const denied = await denyUnlessAdmin(request, true);
  if (denied) return denied;

  let payload: { title?: unknown; slug?: unknown };
  try {
    payload = (await request.json()) as { title?: unknown; slug?: unknown };
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!title) return json({ error: "title_required" }, 400);

  const slug = slugifyTag(typeof payload.slug === "string" && payload.slug ? payload.slug : title);
  if (!isValidSlug(slug)) return json({ error: "invalid_slug" }, 400);
  if (await slugExists(slug)) return json({ error: "slug_taken" }, 409);

  await createPost(slug, title);
  await audit("create", request, { slug });
  return json({ slug }, 201);
}

export const Route = createFileRoute("/admin/api/posts")({
  server: {
    handlers: {
      GET: ({ request }) => handleList(request),
      POST: ({ request }) => handleCreate(request),
      HEAD: () => notFound(),
      PUT: () => notFound(),
      PATCH: () => notFound(),
      DELETE: () => notFound(),
    },
  },
});

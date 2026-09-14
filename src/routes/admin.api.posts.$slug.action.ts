import { createFileRoute } from "@tanstack/react-router";
import { audit, denyUnlessAdmin, isValidSlug, json, notFound } from "#/lib/admin-auth";
import { getAdminPost, publishPost, setPublished } from "#/lib/admin-posts";
import { signPreviewToken } from "#/lib/preview";

async function handleAction(request: Request, slug: string): Promise<Response> {
  const denied = await denyUnlessAdmin(request, true);
  if (denied) return denied;
  if (!isValidSlug(slug)) return notFound();
  if (!(await getAdminPost(slug))) return notFound();

  let payload: { action?: unknown };
  try {
    payload = (await request.json()) as { action?: unknown };
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  switch (payload.action) {
    case "publish": {
      const result = await publishPost(slug);
      if (result === "not_found") return notFound();
      if (result === "conflict") return json({ error: "draft_changed" }, 409);
      await audit("publish", request, { slug });
      return json({ ok: true });
    }
    case "unpublish": {
      await setPublished(slug, false);
      await audit("unpublish", request, { slug });
      return json({ ok: true });
    }
    case "preview": {
      const token = await signPreviewToken(slug);
      const origin = new URL(request.url).origin;
      return json({ url: `${origin}/posts/${slug}?preview=${encodeURIComponent(token)}` });
    }
    default:
      return json({ error: "unknown_action" }, 400);
  }
}

export const Route = createFileRoute("/admin/api/posts/$slug/action")({
  server: {
    handlers: {
      POST: ({ request, params }) => handleAction(request, params.slug),
      GET: () => notFound(),
      HEAD: () => notFound(),
      PUT: () => notFound(),
      PATCH: () => notFound(),
      DELETE: () => notFound(),
    },
  },
});

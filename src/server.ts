import startEntry from "@tanstack/react-start/server-entry";
import { getSession, isAdminHost, notFound } from "#/lib/admin-auth";
import { PREVIEW_HEADERS } from "#/lib/preview";

const PRIMARY_HOST = "saad.sh";
const ALTERNATE_HOSTS = new Set(["saadbash.com"]);

const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/enroll",
  "/admin/api/auth/options",
  "/admin/api/auth/verify",
]);

function canonicalUrl(request: Request): URL | null {
  const url = new URL(request.url);
  let mutated = false;

  if (url.hostname !== PRIMARY_HOST && ALTERNATE_HOSTS.has(url.hostname)) {
    url.hostname = PRIMARY_HOST;
    url.protocol = "https:";
    url.port = "";
    mutated = true;
  }

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
    mutated = true;
  }

  return mutated ? url : null;
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

async function guardAdmin(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!isAdminPath(url.pathname)) return null;
  if (!isAdminHost(url)) return notFound();
  if (PUBLIC_ADMIN_PATHS.has(url.pathname)) return null;

  const session = await getSession(request);
  return session ? null : notFound();
}

export default {
  async fetch(request, ...rest) {
    const isPreview = new URL(request.url).searchParams.has("preview");
    if (request.method === "GET" || request.method === "HEAD") {
      const target = canonicalUrl(request);
      if (target) {
        return new Response(null, {
          status: 301,
          headers: {
            Location: target.toString(),
            ...(isPreview
              ? PREVIEW_HEADERS
              : { "Cache-Control": "public, max-age=3600, s-maxage=86400" }),
          },
        });
      }
    }

    const blocked = await guardAdmin(request);
    if (blocked) return blocked;

    const response = await startEntry.fetch(request, ...rest);

    if (isPreview) {
      const headers = new Headers(response.headers);
      for (const [name, value] of Object.entries(PREVIEW_HEADERS)) headers.set(name, value);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
} satisfies typeof startEntry;

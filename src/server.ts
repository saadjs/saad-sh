import startEntry from "@tanstack/react-start/server-entry";

const PRIMARY_HOST = "saad.sh";
const ALTERNATE_HOSTS = new Set(["www.saad.sh", "saadbash.com", "www.saadbash.com"]);

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

export default {
  fetch(request, ...rest) {
    if (request.method === "GET" || request.method === "HEAD") {
      const target = canonicalUrl(request);
      if (target) {
        return new Response(null, {
          status: 301,
          headers: {
            Location: target.toString(),
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      }
    }
    return startEntry.fetch(request, ...rest);
  },
} satisfies typeof startEntry;

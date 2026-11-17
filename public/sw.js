// Offline support for saad.sh.
//
// Online, nothing changes: pages and data always come from the network, so a
// new post or a style switch shows up at once. Every page a visitor opens is
// also kept, and served again when the network is gone. Fingerprinted assets
// and fonts never change, so those are served from the cache first.
//
// Bump VERSION to drop everything a previous worker stored.
const VERSION = "v1";
const ASSETS = `assets-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const PAGE_LIMIT = 80;
// A page reached inside the app is fetched again for saving once its copy is
// older than this, so the offline copy does not fall months behind.
const SAVED_PAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Never stored or replayed: forms, tokens and anything that is not content.
// The router's data requests (/_serverFn/) are left out too: they can carry
// tokens, and one per hovered link would push real pages out of the cache.
const BYPASS = [/^\/api\//, /^\/newsletter\/confirm/, /^\/_serverFn\//, /^\/sw\.js$/];
const IMMUTABLE = [/^\/assets\//, /^\/fonts\//];
const MEDIA = [/^\/static\//, /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name !== ASSETS && name !== PAGES) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("range")) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (BYPASS.some((pattern) => pattern.test(url.pathname))) return;

  if (IMMUTABLE.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
  } else if (MEDIA.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(event, request));
  } else {
    event.respondWith(networkFirst(event, request));
  }
});

// Moving between pages inside the app fetches data, not documents, so the page
// asks for the document of each page it lands on to be kept as well.
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "save-page" || typeof data.url !== "string") return;
  const url = new URL(data.url, self.location.origin);
  if (url.origin !== self.location.origin) return;
  if (BYPASS.some((pattern) => pattern.test(url.pathname))) return;
  url.hash = "";
  event.waitUntil(savePage(url.href));
});

async function savePage(href) {
  const cache = await caches.open(PAGES);
  const saved = await cache.match(href);
  const savedAt = saved ? Date.parse(saved.headers.get("date") || "") : NaN;
  if (Date.now() - savedAt < SAVED_PAGE_MAX_AGE_MS) return;
  try {
    const response = await fetch(href, { credentials: "same-origin" });
    const html = (response.headers.get("content-type") || "").includes("text/html");
    if (response.ok && html && !response.redirected) {
      await cache.put(href, response);
      await trim(cache);
    }
  } catch {
    // Saving is best effort; the page is already on screen.
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  const refresh = fetch(request).then((response) => {
    if (response.ok) return cache.put(request, response.clone()).then(() => response);
    return response;
  });
  if (!hit) return refresh;
  // The copy on hand answers now; the fresh one is for next time.
  event.waitUntil(refresh.catch(() => {}));
  return hit;
}

async function networkFirst(event, request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    // A redirected response cannot answer a later navigation, so it is not kept.
    if (response.ok && response.type === "basic" && !response.redirected) {
      event.waitUntil(cache.put(request, response.clone()).then(() => trim(cache)));
    }
    return response;
  } catch (error) {
    const hit = await cache.match(request);
    if (hit) return hit;
    if (request.mode === "navigate") {
      // A campaign or preview parameter should not hide a page that is saved.
      const close = await cache.match(request, { ignoreSearch: true });
      return close || offlinePage();
    }
    throw error;
  }
}

// Oldest entries go first; Cache.keys() returns them in insertion order.
async function trim(cache) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - PAGE_LIMIT))) {
    await cache.delete(key);
  }
}

// Shown for a page that was never opened while online. It lists the posts
// that were, read straight from the cache by the page itself.
function offlinePage() {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Offline | saad.sh</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#1a1a1a;--muted:#5e5e5e;--border:#e8e8e8;--accent:#1a4fb4}
@media (prefers-color-scheme:dark){:root{--bg:#141414;--fg:#ececea;--muted:#a3a3a0;--border:#2a2a2a;--accent:#8fb4ff}}
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:2rem 1.25rem;background:var(--bg);color:var(--fg);font:1.0625rem/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
main{width:100%;max-width:32rem}
h1{margin:0 0 .5rem;font-size:2rem;line-height:1.15;letter-spacing:-.02em}
p{margin:0;color:var(--muted)}
h2{margin:2.5rem 0 .25rem;font-size:.8125rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
ul{margin:0;padding:0;list-style:none}
li a{display:flex;align-items:center;min-height:2.75rem;padding:.5rem 0;border-top:1px solid var(--border);color:inherit;text-decoration:none}
li a:hover{color:var(--accent)}
button{margin-top:1.5rem;min-height:2.75rem;padding:0 1rem;border:1px solid var(--border);border-radius:6px;background:none;color:inherit;font:inherit;font-size:.9375rem;cursor:pointer}
[hidden]{display:none}
</style>
</head>
<body>
<main>
<h1>You are offline.</h1>
<p>This page has not been saved on this device yet.</p>
<button type="button" onclick="location.reload()">Try again</button>
<section id="saved" hidden>
<h2>Saved on this device</h2>
<ul id="list"></ul>
</section>
</main>
<script>
(async function () {
  var cache = await caches.open(${JSON.stringify(PAGES)});
  var list = document.getElementById("list");
  var seen = {};
  for (var request of (await cache.keys()).reverse()) {
    var url = new URL(request.url);
    if (!/^\\/posts\\/[^/.]+$/.test(url.pathname) || seen[url.pathname]) continue;
    var response = await cache.match(request);
    if (!response || !(response.headers.get("content-type") || "").includes("text/html")) continue;
    var title = new DOMParser().parseFromString(await response.text(), "text/html").title;
    if (!title) continue;
    seen[url.pathname] = true;
    var link = document.createElement("a");
    link.href = url.pathname;
    link.textContent = title.replace(/ \\| saad\\.sh$/, "");
    var item = document.createElement("li");
    item.append(link);
    list.append(item);
  }
  if (list.children.length) document.getElementById("saved").hidden = false;
})();
addEventListener("online", function () { location.reload(); });
</script>
</body>
</html>`;
  return new Response(html, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

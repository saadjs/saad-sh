// @vitest-environment node
// Runs public/sw.js against a fake worker scope to check what it stores and
// what it answers with when the network is gone.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

const source = readFileSync(join(import.meta.dirname, "../../public/sw.js"), "utf8");
const origin = "https://saad.sh";

type Listener = (event: FetchEventStub) => void;

interface FetchEventStub {
  request: Request;
  respondWith(response: Promise<Response>): void;
  waitUntil(work: Promise<unknown>): void;
}

class FakeCache {
  entries = new Map<string, Response>();
  async match(request: Request | string, options?: { ignoreSearch?: boolean }) {
    const url = typeof request === "string" ? request : request.url;
    const bare = (value: string) => value.split("?")[0];
    for (const [key, response] of this.entries) {
      if (key === url || (options?.ignoreSearch && bare(key) === bare(url))) {
        return response.clone();
      }
    }
    return undefined;
  }
  async put(request: Request | string, response: Response) {
    const url = typeof request === "string" ? request : request.url;
    this.entries.delete(url);
    this.entries.set(url, response);
  }
  async keys() {
    return [...this.entries.keys()].map((url) => new Request(url));
  }
  async delete(request: Request) {
    return this.entries.delete(request.url);
  }
}

function boot() {
  const stores = new Map<string, FakeCache>();
  const listeners = new Map<string, Listener>();
  const network = { online: true, calls: 0, respond: () => new Response("fresh") };
  const scope = {
    location: new URL(origin),
    skipWaiting() {},
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
  };
  const caches = {
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new FakeCache());
      return stores.get(name)!;
    },
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
  };
  const fetch = async () => {
    network.calls += 1;
    if (!network.online) throw new TypeError("Failed to fetch");
    const response = network.respond();
    // `type` is only set by a real network stack.
    Object.defineProperty(response, "type", { value: "basic" });
    return response;
  };
  new Function("self", "caches", "fetch", source)(scope, caches, fetch);

  /** Sends a request through the worker; undefined means it left it alone. */
  async function request(path: string, init?: RequestInit & { navigate?: boolean }) {
    const req = new Request(origin + path, init);
    if (init?.navigate) Object.defineProperty(req, "mode", { value: "navigate" });
    let answer: Promise<Response> | undefined;
    const pending: Promise<unknown>[] = [];
    listeners.get("fetch")!({
      request: req,
      respondWith: (response) => void (answer = response),
      waitUntil: (work) => void pending.push(work),
    });
    const response = await answer;
    await Promise.all(pending);
    return response;
  }

  /** Posts a message to the worker, as the page does after changing page. */
  async function message(data: unknown) {
    const pending: Promise<unknown>[] = [];
    (listeners.get("message") as unknown as (event: unknown) => void)({
      data,
      waitUntil: (work: Promise<unknown>) => void pending.push(work),
    });
    await Promise.all(pending);
  }

  return { network, request, message, stores };
}

describe("service worker", () => {
  let worker: ReturnType<typeof boot>;

  beforeEach(() => {
    worker = boot();
  });

  it("serves pages from the network while online, even when a copy is stored", async () => {
    worker.network.respond = () => new Response("first");
    await worker.request("/posts/a", { navigate: true });
    worker.network.respond = () => new Response("second");
    const response = await worker.request("/posts/a", { navigate: true });
    expect(await response!.text()).toBe("second");
  });

  it("serves the stored copy of a page when the network is gone", async () => {
    worker.network.respond = () => new Response("the post");
    await worker.request("/posts/a", { navigate: true });
    worker.network.online = false;
    const response = await worker.request("/posts/a", { navigate: true });
    expect(await response!.text()).toBe("the post");
  });

  it("answers an unseen page with the offline page when the network is gone", async () => {
    worker.network.online = false;
    const response = await worker.request("/about", { navigate: true });
    expect(response!.status).toBe(503);
    expect(await response!.text()).toContain("You are offline.");
  });

  it("does not store error responses", async () => {
    worker.network.respond = () => new Response("missing", { status: 404 });
    await worker.request("/posts/nope", { navigate: true });
    worker.network.online = false;
    const response = await worker.request("/posts/nope", { navigate: true });
    expect(response!.status).toBe(503);
  });

  it("serves fingerprinted assets from the cache without asking the network again", async () => {
    await worker.request("/assets/index-abc123.js");
    await worker.request("/assets/index-abc123.js");
    expect(worker.network.calls).toBe(1);
  });

  it("leaves form posts, the API and other origins alone", async () => {
    expect(await worker.request("/api/newsletter/subscribe")).toBeUndefined();
    expect(await worker.request("/newsletter/confirm?token=abc")).toBeUndefined();
    expect(await worker.request("/posts/a", { method: "POST" })).toBeUndefined();
    expect(worker.network.calls).toBe(0);
    expect(worker.stores.size).toBe(0);
  });

  const page = () => new Response("the post", { headers: { "content-type": "text/html" } });

  it("keeps the document of a page reached inside the app", async () => {
    worker.network.respond = page;
    await worker.message({ type: "save-page", url: `${origin}/posts/a#section` });
    worker.network.online = false;
    const response = await worker.request("/posts/a", { navigate: true });
    expect(await response!.text()).toBe("the post");
  });

  it("fetches a page reached inside the app again only once its copy is a day old", async () => {
    const dated = (date: Date) => () =>
      new Response("the post", {
        headers: { "content-type": "text/html", date: date.toUTCString() },
      });
    const save = () => worker.message({ type: "save-page", url: `${origin}/posts/a` });

    worker.network.respond = dated(new Date());
    await save();
    await save();
    expect(worker.network.calls).toBe(1);

    const cache = worker.stores.get("pages-v1")!;
    await cache.put(`${origin}/posts/a`, dated(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))());
    await save();
    expect(worker.network.calls).toBe(2);
  });

  it("refuses to keep pages from other origins or token URLs", async () => {
    worker.network.respond = page;
    await worker.message({ type: "save-page", url: "https://example.com/posts/a" });
    await worker.message({ type: "save-page", url: `${origin}/newsletter/confirm?token=abc` });
    expect(worker.network.calls).toBe(0);
  });

  it("does not store the router's data requests", async () => {
    expect(await worker.request("/_serverFn/abc?payload=%7B%7D")).toBeUndefined();
    expect(worker.stores.size).toBe(0);
  });

  it("opens a saved page offline when only the query string differs", async () => {
    worker.network.respond = page;
    await worker.request("/posts/a", { navigate: true });
    worker.network.online = false;
    const response = await worker.request("/posts/a?utm_source=x", { navigate: true });
    expect(await response!.text()).toBe("the post");
  });

  it("keeps a bounded number of pages, dropping the oldest", async () => {
    for (let index = 0; index < 85; index += 1) await worker.request(`/posts/p${index}`);
    const pages = await worker.stores.get("pages-v1")!.keys();
    expect(pages).toHaveLength(80);
    expect(pages[0].url).toBe(`${origin}/posts/p5`);
  });
});

import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { PostEditor } from "#/routes/admin.posts.$slug";
import type { AdminPostDetail } from "#/lib/admin-posts";

const post: AdminPostDetail = {
  slug: "test-post",
  published: true,
  updatedAt: "2026-09-14T00:00:00.000Z",
  draft: null,
  draftVersion: null,
  live: {
    title: "Original",
    description: "",
    date: "2026-09-14",
    tags: [],
    image: null,
    body: "Original body",
  },
};

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function openEditor() {
  const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "PATCH") {
      return Response.json({ savedAt: new Date().toISOString() });
    }
    return Response.json({ post, hast: { type: "root", children: [] }, ok: true });
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("scrollTo", vi.fn());
  const root = createRootRoute({ component: Outlet });
  const editor = createRoute({
    getParentRoute: () => root,
    path: "/admin/posts/$slug",
    component: () => <PostEditor slug="test-post" />,
  });
  const index = createRoute({
    getParentRoute: () => root,
    path: "/admin",
    component: () => <p>Post list</p>,
  });
  const router = createRouter({
    routeTree: root.addChildren([editor, index]),
    history: createMemoryHistory({ initialEntries: ["/admin/posts/test-post"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByDisplayValue("Original body");
  return { fetchMock, router };
}

function edit(body: string) {
  fireEvent.change(screen.getByRole("textbox", { name: "Post markdown" }), {
    target: { value: body },
  });
}

it("does not publish or replace local edits after a save fails", async () => {
  const { fetchMock } = await openEditor();
  fetchMock.mockImplementation(async (_url, init) =>
    init?.method === "PATCH"
      ? Response.json({ error: "invalid_fields" }, { status: 400 })
      : Response.json({ post, ok: true }),
  );
  edit("Unsaved text");
  fireEvent.click(screen.getByRole("button", { name: "Publish changes" }));
  await screen.findByText(/Could not save/);
  expect(screen.getByDisplayValue("Unsaved text")).toBeTruthy();
  expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/action"))).toBe(false);
});

it("does not create a stale preview link after a save fails", async () => {
  const { fetchMock } = await openEditor();
  fetchMock.mockResolvedValue(Response.json({ error: "invalid_fields" }, { status: 400 }));
  edit("Unsaved text");
  fireEvent.click(screen.getByRole("button", { name: "Preview link" }));
  await screen.findByText(/Could not save/);
  expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/action"))).toBe(false);
});

it("preserves pending text when unpublishing", async () => {
  await openEditor();
  edit("Unsaved text");
  fireEvent.click(screen.getByRole("button", { name: "Unpublish" }));
  await screen.findByRole("button", { name: "Publish" });
  expect(screen.getByDisplayValue("Unsaved text")).toBeTruthy();
});

it("blocks client navigation when the user keeps unsaved changes", async () => {
  const { router } = await openEditor();
  const confirm = vi.fn(() => false);
  vi.stubGlobal("confirm", confirm);
  edit("Unsaved text");
  fireEvent.click(screen.getByRole("button", { name: "← Posts" }));
  await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
  expect(router.state.location.pathname).toBe("/admin/posts/test-post");
  expect(screen.getByDisplayValue("Unsaved text")).toBeTruthy();
});

it("keeps edits made while the publish request is in flight", async () => {
  const { fetchMock } = await openEditor();
  const action = deferredResponse();
  fetchMock.mockImplementation(async (url, init) => {
    if (String(url).endsWith("/action")) return action.promise;
    if (init?.method === "PATCH") return Response.json({ savedAt: new Date().toISOString() });
    return Response.json({ post, hast: { type: "root", children: [] } });
  });
  edit("Text being published");
  fireEvent.click(screen.getByRole("button", { name: "Publish changes" }));
  await waitFor(() =>
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/action"))).toBe(true),
  );
  edit("Newer local text");
  action.resolve(Response.json({ ok: true }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Publish changes" }).hasAttribute("disabled")).toBe(
      false,
    ),
  );
  expect(screen.getByDisplayValue("Newer local text")).toBeTruthy();
});

it("serializes overlapping saves so the latest edit is written last", async () => {
  const { fetchMock } = await openEditor();
  const firstSave = deferredResponse();
  let saves = 0;
  fetchMock.mockImplementation(async (_url, init) => {
    if (init?.method === "PATCH" && ++saves === 1) return firstSave.promise;
    return Response.json({
      savedAt: new Date().toISOString(),
      hast: { type: "root", children: [] },
    });
  });
  edit("First edit");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(saves).toBe(1));
  edit("Second edit");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(saves).toBe(1);
  firstSave.resolve(Response.json({ savedAt: new Date().toISOString() }));
  await waitFor(() => expect(saves).toBe(2));
  const writes = fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH");
  expect(JSON.parse(String(writes[1][1]?.body)).body).toBe("Second edit");
});

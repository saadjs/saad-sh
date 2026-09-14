import type { Root } from "hast";
import { createFileRoute, useBlocker, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PostBody } from "#/components/PostBody";
import type { AdminPostDetail, PostFields } from "#/lib/admin-posts";

export const Route = createFileRoute("/admin/posts/$slug")({
  head: () => ({
    meta: [{ title: "Edit · admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: EditorPage,
});

const AUTOSAVE_DELAY_MS = 1500;
const PREVIEW_DELAY_MS = 400;

function fieldsEqual(a: PostFields, b: PostFields): boolean {
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.date === b.date &&
    a.image === b.image &&
    a.body === b.body &&
    a.tags.join(",") === b.tags.join(",")
  );
}

function relativeTime(iso: string): string {
  const seconds = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${Math.round(seconds / 3600)}h ago`;
}

function EditorPage() {
  const { slug } = Route.useParams();
  return <PostEditor key={slug} slug={slug} />;
}

export function PostEditor({ slug }: { slug: string }) {
  const navigate = useNavigate();

  const [detail, setDetail] = useState<AdminPostDetail | null>(null);
  const [fields, setFields] = useState<PostFields | null>(null);
  const [savedFields, setSavedFields] = useState<PostFields | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const saveQueue = useRef(Promise.resolve(true));
  const pendingSaves = useRef(0);
  const actionInFlight = useRef(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Root | null>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [notice, setNotice] = useState("");
  const [, forceTick] = useState(0);

  const dirty = Boolean(fields && savedFields && !fieldsEqual(fields, savedFields));

  useEffect(() => {
    const timer = setInterval(() => forceTick((n) => n + 1), 15_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    void fetch(`/admin/api/posts/${slug}`)
      .then((response) =>
        response.ok
          ? (response.json() as Promise<{ post: AdminPostDetail }>)
          : Promise.reject(new Error("failed")),
      )
      .then((data) => {
        if (!active) return;
        const initial = data.post.draft ?? data.post.live;
        setDetail(data.post);
        setFields(initial);
        setSavedFields(initial);
      })
      .catch(() => {
        if (active) setError("Could not load this post.");
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const save = useCallback(
    (next: PostFields, manual = false): Promise<boolean> => {
      pendingSaves.current += 1;
      setSaving(true);
      const result = saveQueue.current.then(async () => {
        setError("");
        try {
          const response = await fetch(`/admin/api/posts/${slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...next, manual }),
          });
          if (!response.ok) throw new Error("Save failed.");
          const { savedAt: at } = (await response.json()) as { savedAt: string };
          setSavedFields(next);
          setSavedAt(at);
          return true;
        } catch {
          setError("Could not save. Your changes are still here — try again.");
          return false;
        } finally {
          pendingSaves.current -= 1;
          setSaving(pendingSaves.current > 0);
        }
      });
      saveQueue.current = result;
      return result;
    },
    [slug],
  );

  useEffect(() => {
    if (!dirty || !fields || acting) return;
    const timer = setTimeout(() => {
      if (!actionInFlight.current) void save(fields);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [dirty, fields, save, acting]);

  useEffect(() => {
    if (!fields) return;
    const timer = setTimeout(() => {
      void fetch("/admin/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: fields.body }),
      })
        .then((response) =>
          response.ok
            ? (response.json() as Promise<{ hast: Root }>)
            : Promise.reject(new Error("failed")),
        )
        .then((data) => setPreview(data.hast))
        .catch(() => undefined);
    }, PREVIEW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [fields]);

  useBlocker({
    shouldBlockFn: () =>
      (dirty || saving || acting) &&
      !window.confirm("Leave this post? Unsaved changes may be lost."),
    enableBeforeUnload: dirty || saving || acting,
  });

  const act = useCallback(
    async (action: "publish" | "unpublish") => {
      setError("");
      try {
        const response = await fetch(`/admin/api/posts/${slug}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (response.status === 409) {
          setError("The draft changed while publishing. Review it and try again.");
          return;
        }
        if (!response.ok) throw new Error("Action failed.");
        setDetail((current) => current && { ...current, published: action === "publish" });
      } catch {
        setError(`Could not ${action}.`);
      }
    },
    [slug],
  );

  const copyPreviewLink = useCallback(async () => {
    if (fields && (dirty || saving) && !(await save(fields, true))) return;

    const response = await fetch(`/admin/api/posts/${slug}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "preview" }),
    });
    if (!response.ok) {
      setError("Could not create a preview link.");
      return;
    }
    const { url } = (await response.json()) as { url: string };
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Preview link copied. It works for 7 days.");
    } catch {
      setNotice(url);
    }
  }, [dirty, fields, save, saving, slug]);

  const remove = useCallback(async () => {
    if (!window.confirm("Delete this post? It stops being served immediately.")) return;
    const response = await fetch(`/admin/api/posts/${slug}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Could not delete.");
      return;
    }
    await navigate({ to: "/admin", ignoreBlocker: true });
  }, [navigate, slug]);

  const publish = useCallback(async () => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setActing(true);
    try {
      if (!fields || !(await save(fields, true))) return;
      await act("publish");
    } finally {
      actionInFlight.current = false;
      setActing(false);
    }
  }, [act, fields, save]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;
      if (event.key === "s") {
        event.preventDefault();
        if (fields && !actionInFlight.current) void save(fields, true);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        void publish();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fields, publish, save]);

  const tagsValue = useMemo(() => fields?.tags.join(", ") ?? "", [fields]);

  if (error && !fields) {
    return <p className="py-16 text-sm text-red-500">{error}</p>;
  }
  if (!fields || !detail) {
    return <p className="py-16 text-sm text-muted">Loading…</p>;
  }

  const update = (patch: Partial<PostFields>) => setFields({ ...fields, ...patch });

  const statusLabel = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : savedAt
        ? `Saved ${relativeTime(savedAt)}`
        : detail.draft
          ? "Draft"
          : "Up to date";

  return (
    <div className="py-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void navigate({ to: "/admin" })}
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← Posts
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-faint">{statusLabel}</span>
          <button
            type="button"
            disabled={acting}
            onClick={() => void save(fields, true)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            Save
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => void publish()}
            className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {detail.published ? "Publish changes" : "Publish"}
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={() => void copyPreviewLink()}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            Preview link
          </button>
          {detail.published && (
            <button
              type="button"
              disabled={acting}
              onClick={() => void act("unpublish")}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              Unpublish
            </button>
          )}
          <button
            type="button"
            disabled={acting}
            onClick={() => void remove()}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-red-500"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-500">
          {error}
        </p>
      )}
      {notice && <p className="mt-4 break-all text-sm text-accent">{notice}</p>}

      <div className="mt-6 grid shrink-0 gap-3 sm:grid-cols-2 [&_label]:min-w-0 [&_input]:min-w-0 [&_input]:text-base sm:[&_input]:text-sm">
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-muted">Title</span>
          <input
            value={fields.title}
            onChange={(event) => update({ title: event.target.value })}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-muted">Description</span>
          <input
            value={fields.description}
            onChange={(event) => update({ description: event.target.value })}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-muted">Date</span>
          <input
            type="date"
            value={fields.date}
            onChange={(event) => update({ date: event.target.value })}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-muted">Tags</span>
          <input
            value={tagsValue}
            onChange={(event) =>
              update({ tags: event.target.value.split(",").map((tag) => tag.trim()) })
            }
            placeholder="ai, typescript"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
      </div>

      <div className="mt-6 flex shrink-0 gap-2 lg:hidden">
        {(["write", "preview"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
              tab === value ? "border-accent text-accent" : "border-border text-muted"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mt-4 grid min-w-0 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:gap-6">
        <div
          className={`min-w-0 lg:flex lg:min-h-0 lg:flex-col ${tab === "write" ? "" : "hidden"}`}
        >
          <div className="relative h-[60vh] lg:h-auto lg:min-h-0 lg:flex-1">
            <textarea
              value={fields.body}
              aria-label="Post markdown"
              onChange={(event) => update({ body: event.target.value })}
              spellCheck={false}
              className="absolute inset-0 h-full w-full min-w-0 resize-none rounded-lg border border-border bg-transparent p-3 font-mono text-base leading-6 text-foreground outline-none focus:border-accent sm:text-sm"
            />
          </div>
        </div>
        <div
          className={`min-w-0 lg:flex lg:min-h-0 lg:flex-col ${tab === "preview" ? "" : "hidden"}`}
        >
          <div className="relative h-[60vh] lg:h-auto lg:min-h-0 lg:flex-1">
            <div className="admin-preview absolute inset-0 overflow-y-auto rounded-lg border border-border p-4">
              {preview ? <PostBody hast={preview} /> : <p className="text-sm text-muted">…</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

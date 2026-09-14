import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { AdminPostSummary } from "#/lib/admin-posts";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Posts · admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminIndex,
});

function statusOf(post: AdminPostSummary): { label: string; className: string } {
  if (post.draftUpdatedAt) {
    return { label: "Draft changes", className: "border-accent/40 text-accent" };
  }
  if (post.published) return { label: "Live", className: "border-border text-muted" };
  return { label: "Unpublished", className: "border-border text-faint" };
}

function AdminIndex() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<AdminPostSummary[] | null>(null);
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/admin/api/posts")
      .then((response) =>
        response.ok
          ? (response.json() as Promise<{ posts: AdminPostSummary[] }>)
          : Promise.reject(new Error("failed")),
      )
      .then((data) => {
        if (active) setPosts(data.posts);
      })
      .catch(() => {
        if (active) setError("Could not load posts.");
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    if (!posts) return [];
    const needle = filter.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(needle) || post.slug.toLowerCase().includes(needle),
    );
  }, [posts, filter]);

  async function createPost() {
    const title = window.prompt("Title");
    if (!title?.trim()) return;

    setCreating(true);
    setError("");
    try {
      const response = await fetch("/admin/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (response.status === 409) throw new Error("A post with that slug already exists.");
      if (!response.ok) throw new Error("Could not create the post.");

      const { slug } = (await response.json()) as { slug: string };
      await navigate({ to: "/admin/posts/$slug", params: { slug } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the post.");
    } finally {
      setCreating(false);
    }
  }

  async function signOut() {
    await fetch("/admin/api/auth/logout", { method: "POST" });
    await navigate({ to: "/admin/login" });
  }

  return (
    <div className="py-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Posts</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void createPost()}
            disabled={creating}
            className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            New post
          </button>
          <button
            type="button"
            onClick={() => void navigate({ to: "/admin/settings" })}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            Passkeys
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>

      <input
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filter posts"
        className="mt-6 w-full shrink-0 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
      />

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-500">
          {error}
        </p>
      )}

      {posts === null && !error && <p className="mt-8 text-sm text-muted">Loading…</p>}

      <div className="relative mt-6 lg:min-h-0 lg:flex-1">
        <div className="pb-6 lg:absolute lg:inset-0 lg:overflow-y-auto">
          <ul className="divide-y divide-border border-t border-border">
            {visible.map((post) => {
              const status = statusOf(post);
              return (
                <li key={post.slug}>
                  <Link
                    to="/admin/posts/$slug"
                    params={{ slug: post.slug }}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.95rem] text-foreground">
                        {post.title}
                      </span>
                      <span className="block truncate font-mono text-xs text-faint">
                        {post.slug}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {posts !== null && visible.length === 0 && (
            <p className="mt-8 text-sm text-muted">No posts match.</p>
          )}
        </div>
      </div>
    </div>
  );
}

import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { formatDate, slugifyTag } from "#/lib/utils";

type SearchIndexEntry = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  image?: string;
  excerpt: string;
  searchText: string;
};

type SearchIndexProject = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
  searchText: string;
};

type SearchIndexPayload = {
  posts: SearchIndexEntry[];
  projects: SearchIndexProject[];
};

type TagResult = {
  type: "tag";
  label: string;
  slug: string;
  count: number;
  score: number;
};

type PostResult = SearchIndexEntry & { type: "post"; score: number };

type ProjectResult = SearchIndexProject & { type: "project"; score: number };

const RESULTS_LIMIT = 10;
const resultClassName =
  "group min-h-11 px-3 py-3 text-[0.9375rem] leading-6 transition-colors hover:bg-border/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]";

function normalizeQuery(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreEntry(entry: SearchIndexEntry, terms: string[]) {
  const title = entry.title.toLowerCase();
  const description = (entry.description ?? "").toLowerCase();
  const tags = entry.tags.join(" ").toLowerCase();
  const content = entry.searchText;

  let score = 0;

  for (const term of terms) {
    if (!term) continue;
    if (title === term) score += 6;
    if (title.startsWith(term)) score += 4;
    if (title.includes(term)) score += 3;
    if (tags.includes(term)) score += 3;
    if (description.includes(term)) score += 2;
    if (content.includes(term)) score += 1;
  }

  return score;
}

function scoreProject(project: SearchIndexProject, terms: string[]) {
  const name = project.name.toLowerCase();
  const tags = project.tags.join(" ").toLowerCase();
  const description = project.description.toLowerCase();

  let score = 0;

  for (const term of terms) {
    if (!term) continue;
    if (name === term) score += 6;
    if (name.startsWith(term)) score += 4;
    if (name.includes(term)) score += 3;
    if (tags.includes(term)) score += 3;
    if (description.includes(term)) score += 2;
    if (project.searchText.includes(term)) score += 1;
  }

  return score;
}

// A cached client from before projects were indexed still receives the old
// bare-array payload, so both shapes are accepted.
function normalizePayload(data: unknown): SearchIndexPayload {
  if (Array.isArray(data)) return { posts: data as SearchIndexEntry[], projects: [] };
  const payload = data as Partial<SearchIndexPayload>;
  return { posts: payload?.posts ?? [], projects: payload?.projects ?? [] };
}

export function SearchCommand({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState<SearchIndexPayload | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
      inputRef.current?.focus();
    } else {
      dialog.close();
      // Reset the search when the native dialog is closed by its parent.
      // oxlint-disable-next-line react/set-state-in-effect
      setQuery("");
      setActiveIndex(0);
    }
    return () => dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open || index) return;
    const controller = new AbortController();
    const loadIndex = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/search-index.json", { signal: controller.signal });
        if (!response.ok) throw new Error("Search index request failed");
        const payload = normalizePayload(await response.json());
        if (!controller.signal.aborted) setIndex(payload);
      } catch (fetchError) {
        if (!controller.signal.aborted)
          setError(
            fetchError instanceof Error ? fetchError.message : "Failed to load search index",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void loadIndex();
    return () => controller.abort();
  }, [open, index, attempt]);

  const { postResults, tagResults, projectResults, combinedResults } = useMemo(() => {
    if (!index) {
      return {
        postResults: [] as PostResult[],
        tagResults: [] as TagResult[],
        projectResults: [] as ProjectResult[],
        combinedResults: [] as (PostResult | TagResult | ProjectResult)[],
      };
    }

    const normalized = normalizeQuery(query);
    const terms = normalized ? normalized.split(" ") : [];

    const postResults = index.posts
      .map((entry) => ({ ...entry, type: "post" as const, score: scoreEntry(entry, terms) }))
      .filter((entry) => (normalized ? entry.score > 0 : true))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, RESULTS_LIMIT);

    // Projects only surface for an actual query; the empty state stays the
    // tags-plus-recent-posts panel it has always been.
    const projectResults = normalized
      ? index.projects
          .map((project) => ({
            ...project,
            type: "project" as const,
            score: scoreProject(project, terms),
          }))
          .filter((project) => project.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, RESULTS_LIMIT)
      : [];

    const tagCount = new Map<string, number>();
    for (const entry of index.posts) {
      for (const tag of entry.tags) {
        const slug = slugifyTag(tag);
        if (!slug) continue;
        tagCount.set(slug, (tagCount.get(slug) ?? 0) + 1);
      }
    }

    const tagResults = Array.from(tagCount.entries())
      .map(([slug, count]) => {
        const label = slug.replace(/-/g, " ");
        const score = normalized && slug.includes(normalized) ? 3 : 0;
        return { type: "tag" as const, slug, label, count, score };
      })
      .filter((tag) => (normalized ? tag.score > 0 : true))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.count - a.count;
      })
      .slice(0, RESULTS_LIMIT);

    const combinedResults = [...tagResults, ...projectResults, ...postResults];

    return { postResults, tagResults, projectResults, combinedResults };
  }, [index, query]);

  if (activeIndex !== 0 && activeIndex >= combinedResults.length) {
    setActiveIndex(0);
  }

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeItem = list.querySelector<HTMLElement>(`[data-result-index="${activeIndex}"]`);
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, combinedResults.length]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    const controlKey = event.ctrlKey && !event.altKey && !event.metaKey;
    if (event.key === "ArrowDown" || (controlKey && event.key.toLowerCase() === "n")) {
      event.preventDefault();
      if (combinedResults.length > 0) {
        setActiveIndex((prev) => Math.min(prev + 1, combinedResults.length - 1));
      }
    }
    if (event.key === "ArrowUp" || (controlKey && event.key.toLowerCase() === "p")) {
      event.preventDefault();
      if (combinedResults.length > 0) {
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = combinedResults[activeIndex];
      if (selected?.type === "post") {
        router.navigate({ to: "/posts/$slug", params: { slug: selected.slug } });
        onClose();
      }
      if (selected?.type === "tag") {
        router.navigate({ to: "/tags/$tag", params: { tag: selected.slug } });
        onClose();
      }
      if (selected?.type === "project") {
        router.navigate({ to: "/projects", hash: selected.slug });
        onClose();
      }
    }
  };

  return (
    // Native dialogs handle Escape and backdrop clicks; the element is interactive.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      aria-label="Search posts, projects, or tags"
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent px-4 py-6 font-sans text-foreground backdrop:bg-foreground/20 open:flex open:items-start open:justify-center sm:py-[12vh]"
    >
      <div className="flex max-h-full w-full max-w-[35.625rem] flex-col overflow-hidden rounded-md border border-border bg-background shadow-xl shadow-black/10">
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-4 focus-within:border-accent sm:px-6">
          <span className="size-2 shrink-0 bg-accent" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search posts, projects, or tags…"
            className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted"
            aria-label="Search posts, projects, or tags"
          />
        </div>
        <div ref={listRef} className="min-h-0 overflow-y-auto overscroll-contain px-2 py-5 sm:px-3">
          {loading && (
            <output className="block px-3 text-sm text-muted">Loading search index…</output>
          )}
          {error && (
            <div role="alert" className="px-3">
              <p className="text-sm text-foreground">{error}</p>
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="touch-target mt-2 text-sm text-accent underline underline-offset-4"
              >
                Retry search
              </button>
            </div>
          )}
          {!loading && !error && combinedResults.length === 0 && (
            <output className="block px-3 text-sm text-muted">
              No results. Try another search.
            </output>
          )}
          {!loading && !error && combinedResults.length > 0 && (
            <div className="space-y-6">
              {tagResults.length > 0 && (
                <div>
                  <p className="mb-2 px-3 font-mono text-xs font-normal text-muted">Tags</p>
                  <ul>
                    {tagResults.map((result, index) => {
                      const overallIndex = index;
                      const isActive = overallIndex === activeIndex;
                      return (
                        <li key={`tag-${result.slug}`}>
                          <Link
                            to="/tags/$tag"
                            params={{ tag: result.slug }}
                            onClick={() => onClose()}
                            data-result-index={overallIndex}
                            className={`${resultClassName} flex items-baseline justify-between gap-4 ${
                              isActive ? "bg-accent/10 text-accent" : "text-foreground"
                            }`}
                          >
                            <span className="min-w-0 break-words underline-offset-4 group-hover:underline">
                              {result.label}
                            </span>
                            <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
                              {result.count}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {projectResults.length > 0 && (
                <div>
                  <p className="mb-2 px-3 font-mono text-xs font-normal text-muted">Projects</p>
                  <ul>
                    {projectResults.map((result, index) => {
                      const overallIndex = tagResults.length + index;
                      const isActive = overallIndex === activeIndex;
                      return (
                        <li key={`project-${result.slug}`}>
                          <Link
                            to="/projects"
                            hash={result.slug}
                            onClick={() => onClose()}
                            data-result-index={overallIndex}
                            className={`${resultClassName} flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 ${
                              isActive ? "bg-accent/10 text-accent" : "text-foreground"
                            }`}
                          >
                            <span className="min-w-0 break-words underline-offset-4 group-hover:underline">
                              {result.name}
                            </span>
                            <span className="font-mono text-xs text-muted">
                              {result.tags.slice(0, 2).join(" · ")}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {postResults.length > 0 && (
                <div>
                  <p className="mb-2 px-3 font-mono text-xs font-normal text-muted">Posts</p>
                  <ul>
                    {postResults.map((result, index) => {
                      const overallIndex = tagResults.length + projectResults.length + index;
                      const isActive = overallIndex === activeIndex;
                      return (
                        <li key={`post-${result.slug}`}>
                          <Link
                            to="/posts/$slug"
                            params={{ slug: result.slug }}
                            onClick={() => onClose()}
                            data-result-index={overallIndex}
                            className={`${resultClassName} flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 ${
                              isActive ? "bg-accent/10 text-accent" : "text-foreground"
                            }`}
                          >
                            <span className="min-w-0 break-words underline-offset-4 group-hover:underline">
                              {result.title}
                            </span>
                            <time
                              dateTime={result.date}
                              className="shrink-0 font-mono text-xs text-muted tabular-nums"
                            >
                              {formatDate(result.date)}
                            </time>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-5 py-3 font-mono text-[0.6875rem] text-muted sm:px-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="touch-target underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Close (Esc)
          </button>
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <span>↑ ↓ or Ctrl+N/P navigate</span>
            <span>Enter open</span>
          </span>
        </div>
      </div>
    </dialog>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { slugifyTag } from "@/lib/utils";

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

type TagResult = {
  type: "tag";
  label: string;
  slug: string;
  count: number;
  score: number;
};

type PostResult = SearchIndexEntry & { type: "post"; score: number };

const RESULTS_LIMIT = 10;

function normalizeQuery(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreEntry(entry: SearchIndexEntry, terms: string[]) {
  const title = entry.title.toLowerCase();
  const description = entry.description.toLowerCase();
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

export function SearchCommand() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState<SearchIndexEntry[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const onOpen = () => setOpen(true);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("search:open", onOpen as EventListener);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("search:open", onOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }

    const handle = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(handle);
  }, [open]);

  useEffect(() => {
    if (!open || index || loading) return;

    const loadIndex = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/search-index.json");
        if (!response.ok) {
          throw new Error("Search index request failed");
        }
        const data = (await response.json()) as SearchIndexEntry[];
        setIndex(data);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load search index");
      } finally {
        setLoading(false);
      }
    };

    loadIndex();
  }, [open, index, loading]);

  const { postResults, tagResults, combinedResults } = useMemo(() => {
    if (!index) {
      return {
        postResults: [] as PostResult[],
        tagResults: [] as TagResult[],
        combinedResults: [],
      };
    }

    const normalized = normalizeQuery(query);
    const terms = normalized ? normalized.split(" ") : [];

    const postResults = index
      .map((entry) => ({ ...entry, type: "post" as const, score: scoreEntry(entry, terms) }))
      .filter((entry) => (normalized ? entry.score > 0 : true))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, RESULTS_LIMIT);

    const tagCount = new Map<string, number>();
    for (const entry of index) {
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

    const combinedResults = [...tagResults, ...postResults];

    return { postResults, tagResults, combinedResults };
  }, [index, query]);

  useEffect(() => {
    if (activeIndex >= combinedResults.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, combinedResults.length]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeItem = list.querySelector<HTMLElement>(`[data-result-index="${activeIndex}"]`);
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, combinedResults.length]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (combinedResults.length > 0) {
        setActiveIndex((prev) => Math.min(prev + 1, combinedResults.length - 1));
      }
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (combinedResults.length > 0) {
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
    }
    if (event.key === "Enter") {
      const selected = combinedResults[activeIndex];
      if (selected?.type === "post") {
        router.push(`/posts/${selected.slug}`);
        setOpen(false);
      }
      if (selected?.type === "tag") {
        router.push(`/tags/${selected.slug}`);
        setOpen(false);
      }
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-14 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="border-b border-white/10 px-4 py-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search posts or tags..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-400"
            aria-label="Search posts or tags"
          />
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto px-4 py-4">
          {loading && <p className="text-sm text-zinc-400">Loading search index…</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !error && combinedResults.length === 0 && (
            <p className="text-sm text-zinc-400">No results.</p>
          )}
          {!loading && !error && combinedResults.length > 0 && (
            <div className="space-y-6">
              {tagResults.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    Tags
                  </p>
                  <ul className="space-y-2">
                    {tagResults.map((result, index) => {
                      const overallIndex = index;
                      const isActive = overallIndex === activeIndex;
                      return (
                        <li key={`tag-${result.slug}`}>
                          <Link
                            href={`/tags/${result.slug}`}
                            onClick={() => setOpen(false)}
                            data-result-index={overallIndex}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                              isActive ? "bg-white/10 text-white" : "text-zinc-200 hover:bg-white/5"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-zinc-400">→</span>
                              {result.label}
                            </span>
                            <span className="text-xs text-zinc-500">{result.count}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {postResults.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    Posts
                  </p>
                  <ul className="space-y-2">
                    {postResults.map((result, index) => {
                      const overallIndex = tagResults.length + index;
                      const isActive = overallIndex === activeIndex;
                      return (
                        <li key={`post-${result.slug}`}>
                          <Link
                            href={`/posts/${result.slug}`}
                            onClick={() => setOpen(false)}
                            data-result-index={overallIndex}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                              isActive ? "bg-white/10 text-white" : "text-zinc-200 hover:bg-white/5"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-zinc-400">→</span>
                              {result.title}
                            </span>
                            <span className="text-xs text-zinc-500">{result.date}</span>
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
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-zinc-500">
          <span>Press Esc to close</span>
          <span>Use ↑ ↓ to navigate</span>
        </div>
      </div>
    </div>
  );
}

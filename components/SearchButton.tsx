"use client";

import { useSyncExternalStore } from "react";

function getShortcutHint() {
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";
}

function getServerSnapshot() {
  return "⌘ K";
}

function subscribe() {
  return () => {};
}

export function SearchButton() {
  const hint = useSyncExternalStore(subscribe, getShortcutHint, getServerSnapshot);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("search:open"))}
      className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.12em] text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
      aria-label="Open search"
    >
      <span>Search</span>
      <span
        className="rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
        aria-hidden="true"
      >
        {hint}
      </span>
    </button>
  );
}

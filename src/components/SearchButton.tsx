import { useSyncExternalStore } from "react";

function getShortcutHint() {
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "\u2318K" : "Ctrl K";
}

function getServerSnapshot() {
  return "\u2318K";
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
      className="touch-target text-[0.8125rem] text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
      aria-label="Open search"
      title={`Search (${hint})`}
    >
      Search
    </button>
  );
}

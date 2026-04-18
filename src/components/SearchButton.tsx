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
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-faint hover:text-foreground"
      aria-label="Open search"
    >
      <span>Search</span>
      <span className="text-xs text-faint" aria-hidden="true">
        {hint}
      </span>
    </button>
  );
}

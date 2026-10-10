import { useSyncExternalStore } from "react";
import { toggleTheme } from "#/lib/theme";

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getTheme() {
  return document.documentElement.dataset.theme;
}

// The server cannot know the visitor's theme, so the label starts generic.
function getServerTheme() {
  return undefined;
}

// Both icons render and CSS picks one from data-theme, so the server markup
// never depends on the visitor's theme.
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const label =
    theme === "dark"
      ? "Switch to light mode"
      : theme === "light"
        ? "Switch to dark mode"
        : "Switch between light and dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="-mr-2.5 inline-flex size-11 items-center justify-center transition-colors hover:text-accent"
    >
      <svg {...iconProps} className="size-5 dark:hidden">
        <path d="M20.5 14.2A8.5 8.5 0 0 1 9.7 3.6a8.6 8.6 0 1 0 10.8 10.6z" />
      </svg>
      <svg {...iconProps} className="hidden size-5 dark:block">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.6v2.2M12 19.2v2.2M2.7 12h2.2M19.1 12h2.2M5.3 5.4l1.6 1.5M17.1 17.1l1.6 1.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
      </svg>
    </button>
  );
}

export type Theme = "light" | "dark";

export const themeStorageKey = "theme";
const darkQuery = "(prefers-color-scheme: dark)";

// Runs in <head> before first paint so the page never flashes the wrong theme.
// A saved choice wins; otherwise the page follows the system and keeps following it.
export const themeInitScript = `(function(){var m=matchMedia(${JSON.stringify(darkQuery)});function a(){var s=null;try{s=localStorage.getItem(${JSON.stringify(themeStorageKey)})}catch(e){}document.documentElement.dataset.theme=s==="light"||s==="dark"?s:m.matches?"dark":"light"}a();m.addEventListener("change",a)})()`;

export function toggleTheme(): Theme {
  const root = document.documentElement;
  const next: Theme = root.dataset.theme === "dark" ? "light" : "dark";
  const system: Theme = window.matchMedia(darkQuery).matches ? "dark" : "light";
  root.dataset.theme = next;
  try {
    // Landing back on the system's own theme drops the override, so the site
    // goes back to following the system.
    if (next === system) localStorage.removeItem(themeStorageKey);
    else localStorage.setItem(themeStorageKey, next);
  } catch {
    // Storage can be blocked; the choice still applies to this page view.
  }
  return next;
}

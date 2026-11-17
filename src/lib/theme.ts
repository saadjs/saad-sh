export type Theme = "light" | "dark";

export const themeStorageKey = "theme";
const darkQuery = "(prefers-color-scheme: dark)";

// Runs in <head> before first paint so the page never flashes the wrong theme.
// A style with one fixed look sets data-theme-lock on <html> and that wins.
// Otherwise a saved choice wins, then the system, which the page keeps following.
export const themeInitScript = `(function(){var d=document.documentElement,m=matchMedia(${JSON.stringify(darkQuery)});function a(){var l=d.dataset.themeLock,s=null;try{s=localStorage.getItem(${JSON.stringify(themeStorageKey)})}catch(e){}d.dataset.theme=l==="light"||l==="dark"?l:s==="light"||s==="dark"?s:m.matches?"dark":"light"}a();m.addEventListener("change",a)})()`;

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

// Keeps the browser chrome (the status bar of an installed app, the toolbar on
// Android) the colour of the page. Runs at the top of <body>, once the style's
// CSS has applied, and again whenever the theme flips. The script owns the tag:
// if React rendered one too, the two would disagree after a navigation.
export const themeColorScript = `(function(){var d=document,r=d.documentElement,m=d.createElement("meta");m.name="theme-color";d.head.appendChild(m);function s(){var c=getComputedStyle(d.body).backgroundColor;if(!c||c==="transparent"||c==="rgba(0, 0, 0, 0)")c=getComputedStyle(r).backgroundColor;if(c&&c!=="rgba(0, 0, 0, 0)")m.content=c}s();new MutationObserver(s).observe(r,{attributeFilter:["data-theme"]})})()`;

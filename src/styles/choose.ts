import { styleCookie, styleCookieMaxAge } from "./resolve";

// The server reads this cookie to render the page in the chosen style, so a
// reload is the whole switch: no flash, and only one style's CSS is ever loaded.
export function chooseStyle(id: string) {
  document.cookie = `${styleCookie}=${id}; path=/; max-age=${styleCookieMaxAge}; samesite=lax`;
  // A `?style=` preview in the URL would override the choice just saved.
  const url = new URL(window.location.href);
  if (url.searchParams.has("style")) {
    url.searchParams.delete("style");
    window.location.replace(url);
  } else {
    window.location.reload();
  }
}

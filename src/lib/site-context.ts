import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { styleConfig, styleIds } from "#/styles";
import { resolveStyle, styleCookie, styleCookieMaxAge } from "#/styles/resolve";
import { newsletterEnabled } from "./features.server";

export interface SiteContext {
  features: { newsletter: boolean };
  styleId: string;
}

const loadSiteContext = createServerFn({ method: "GET" })
  .validator((preview: string | undefined) => preview)
  .handler(({ data: preview }): SiteContext => {
    const features = { newsletter: newsletterEnabled() };
    // `?style=<id>` previews a style for this visit without saving it.
    if (styleConfig.picker && preview && styleIds.includes(preview)) {
      return { features, styleId: preview };
    }
    return { features, styleId: savedStyle() };
  });

function savedStyle(): string {
  const choice = resolveStyle({
    ids: styleIds,
    fallback: styleConfig.default,
    picker: styleConfig.picker,
    saved: getCookie(styleCookie),
  });
  if (choice.persist) {
    setCookie(styleCookie, choice.id, { path: "/", maxAge: styleCookieMaxAge, sameSite: "lax" });
  }
  return choice.id;
}

let cached: Promise<SiteContext> | undefined;

// Feature flags and the style only change on a full page load (the style menu
// reloads), so the browser asks once instead of on every navigation. It asks
// for the style the server already rendered, which keeps a `?style=` preview
// in place while the visitor clicks around.
export function getSiteContext(preview?: string): Promise<SiteContext> {
  if (typeof window === "undefined") return loadSiteContext({ data: preview });
  cached ??= loadSiteContext({ data: document.documentElement.dataset.style }).catch(
    (error: unknown) => {
      cached = undefined;
      throw error;
    },
  );
  return cached;
}

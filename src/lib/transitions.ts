import type { CSSProperties } from "react";

/**
 * Names a post's title so the browser can morph it between a list row and the
 * post page. The same slug must not be named twice on one page: a duplicate
 * makes the browser skip the whole transition.
 */
export function postTitleTransition(slug: string): CSSProperties {
  return {
    viewTransitionName: `post-${slug.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    // Lets one CSS rule address every travelling title.
    viewTransitionClass: "post-title",
  } as CSSProperties;
}

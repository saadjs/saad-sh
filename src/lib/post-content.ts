import { lazyRouteComponent } from "@tanstack/react-router";
import type { FunctionComponent } from "react";

const modules = import.meta.glob<{ default: FunctionComponent }>("../content/posts/*.mdx");

// Preload the component itself so it is ready when Router restores scrolling.
// Creating these once also preserves their identity during revalidation.
const posts = new Map(
  Object.entries(modules).map(([path, importModule]) => {
    const slug = path.slice(path.lastIndexOf("/") + 1, -4);
    const Content = lazyRouteComponent(importModule);
    return [
      slug,
      {
        load: Content.preload!,
        Content,
      },
    ] as const;
  }),
);

export function getPostContent(slug: string) {
  return posts.get(slug);
}

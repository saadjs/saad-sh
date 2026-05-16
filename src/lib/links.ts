import { siteConfig } from "#/site.config";
import type { AnchorHTMLAttributes } from "react";

type AnchorNavigationProps = Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "rel" | "target"
>;

const externalLinkRel = "noreferrer";
const siteOrigin = new URL(siteConfig.url).origin;

export function isExternalHttpHref(href: string | undefined) {
  if (!href) return false;

  try {
    const url = new URL(href, siteConfig.url);
    return (url.protocol === "http:" || url.protocol === "https:") && url.origin !== siteOrigin;
  } catch {
    return false;
  }
}

export function getLinkNavigationProps({ href, rel, target }: AnchorNavigationProps) {
  const resolvedTarget = target ?? (isExternalHttpHref(href) ? "_blank" : undefined);

  if (resolvedTarget !== "_blank") {
    return { rel, target: resolvedTarget };
  }

  const relParts = new Set(rel?.split(/\s+/).filter(Boolean));
  relParts.add(externalLinkRel);

  return {
    rel: Array.from(relParts).join(" "),
    target: resolvedTarget,
  };
}

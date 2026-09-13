import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { getLinkNavigationProps } from "#/lib/links";
import { siteConfig } from "#/site.config";

const origin = new URL(siteConfig.url).origin;
const pagePaths = new Set([
  "/",
  "/posts",
  "/tags",
  "/about",
  "/projects",
  "/newsletter",
  "/newsletter/confirm",
]);

export function ContentLink({
  href,
  children,
  className,
  rel,
  target,
  download,
  ...props
}: ComponentProps<"a">) {
  const navigation = getLinkNavigationProps({ href, rel, target });
  const classes =
    `text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent ${className ?? ""}`.trim();
  let url: URL | undefined;
  let hash = "";
  try {
    if (href) {
      url = new URL(href, siteConfig.url);
      hash = decodeURIComponent(url.hash.slice(1));
    }
  } catch {
    url = undefined;
  }
  const isPage =
    url && (pagePaths.has(url.pathname) || /^\/(posts|tags)\/[^/.]+$/.test(url.pathname));

  if (
    url?.origin === origin &&
    isPage &&
    !href?.startsWith("#") &&
    download === undefined &&
    (!target || target === "_self")
  ) {
    return (
      <Link
        {...props}
        {...navigation}
        to={url.pathname}
        search={Object.fromEntries(url.searchParams)}
        hash={hash}
        className={classes}
      >
        {children}
      </Link>
    );
  }
  return (
    <a {...props} href={href} download={download} {...navigation} className={classes}>
      {children}
    </a>
  );
}

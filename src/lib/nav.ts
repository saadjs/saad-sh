import { siteConfig } from "#/site.config";

/** Whether a nav link is the section the visitor is in. Tag pages count as writing. */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === siteConfig.routes.home) return pathname === href;
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === siteConfig.routes.posts && pathname.startsWith(siteConfig.routes.tags))
  );
}

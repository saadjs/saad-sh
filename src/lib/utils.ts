import ogManifest from "#/og/manifest.json";

// Full date labels use YYYY-MM-DD in UTC; post lists use a shorter display label.
export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
}

export function slugifyTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function absoluteUrl(pathname: string, siteUrl: string): string {
  return new URL(pathname, siteUrl).toString();
}

export function ogImagePath(name: string): string {
  return `/og/${name}.png`;
}

function hasOgCard(slug: string): boolean {
  return Object.hasOwn(ogManifest, slug);
}

export function getPostImageUrl(
  slug: string,
  customImage: string | undefined,
  siteUrl: string,
): string {
  if (customImage) return absoluteUrl(customImage, siteUrl);
  return absoluteUrl(ogImagePath(hasOgCard(slug) ? slug : "site"), siteUrl);
}

import ogManifest from "../../public/og/manifest.json";

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
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

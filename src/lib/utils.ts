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

// Cards live in public/og, rendered at build time by
// scripts/generate-og-images.ts.
export function ogImagePath(name: string): string {
  return `/og/${name}.png`;
}

export function getPostImageUrl(
  slug: string,
  customImage: string | undefined,
  siteUrl: string,
): string {
  return absoluteUrl(customImage ?? ogImagePath(slug), siteUrl);
}

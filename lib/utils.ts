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

export function getPostImageUrl(
  slug: string,
  customImage: string | undefined,
  siteUrl: string,
): string {
  const fallbackImage = absoluteUrl(`/posts/${slug}/opengraph-image`, siteUrl);
  return customImage ? absoluteUrl(customImage, siteUrl) : fallbackImage;
}

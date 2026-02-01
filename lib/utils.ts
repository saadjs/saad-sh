export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
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

export function getPostImageUrl(
  slug: string,
  customImage: string | undefined,
  siteUrl: string,
): string {
  const fallbackImage = new URL(`/posts/${slug}/opengraph-image`, siteUrl).toString();
  return customImage ? new URL(customImage, siteUrl).toString() : fallbackImage;
}

import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { siteConfig } from "@/site.config";
import { slugifyTag } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const tags = await getAllTags();
  const latestPostDate = posts[0] ? new Date(posts[0].metadata.date) : new Date(0);
  const latestTagDates = new Map<string, Date>();

  for (const post of posts) {
    const postDate = new Date(post.metadata.date);
    for (const tag of post.metadata.tags) {
      const slug = slugifyTag(tag);
      if (!slug) continue;
      const existing = latestTagDates.get(slug);
      if (!existing || postDate > existing) {
        latestTagDates.set(slug, postDate);
      }
    }
  }

  const postUrls = posts.map((post) => ({
    url: `${siteConfig.url}${siteConfig.routes.posts}/${post.slug}`,
    lastModified: new Date(post.metadata.date),
    changeFrequency: siteConfig.sitemap.changeFrequency.post,
    priority: siteConfig.sitemap.priority.post,
  }));

  const tagUrls = Array.from(tags.keys()).map((tag) => ({
    url: `${siteConfig.url}${siteConfig.routes.tags}/${tag}`,
    lastModified: latestTagDates.get(tag) ?? latestPostDate,
    changeFrequency: siteConfig.sitemap.changeFrequency.tag,
    priority: siteConfig.sitemap.priority.tag,
  }));

  return [
    {
      url: siteConfig.url,
      lastModified: latestPostDate,
      changeFrequency: siteConfig.sitemap.changeFrequency.home,
      priority: siteConfig.sitemap.priority.home,
    },
    {
      url: `${siteConfig.url}${siteConfig.routes.tags}`,
      lastModified: latestPostDate,
      changeFrequency: siteConfig.sitemap.changeFrequency.tagsIndex,
      priority: siteConfig.sitemap.priority.tagsIndex,
    },
    ...postUrls,
    ...tagUrls,
  ];
}

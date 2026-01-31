import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { siteConfig } from "@/site.config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const tags = await getAllTags();

  const postUrls = posts.map((post) => ({
    url: `${siteConfig.url}${siteConfig.routes.posts}/${post.slug}`,
    lastModified: new Date(post.metadata.date),
    changeFrequency: siteConfig.sitemap.changeFrequency.post,
    priority: siteConfig.sitemap.priority.post,
  }));

  const tagUrls = Array.from(tags.keys()).map((tag) => ({
    url: `${siteConfig.url}${siteConfig.routes.tags}/${tag}`,
    lastModified: new Date(),
    changeFrequency: siteConfig.sitemap.changeFrequency.tag,
    priority: siteConfig.sitemap.priority.tag,
  }));

  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: siteConfig.sitemap.changeFrequency.home,
      priority: siteConfig.sitemap.priority.home,
    },
    {
      url: `${siteConfig.url}${siteConfig.routes.tags}`,
      lastModified: new Date(),
      changeFrequency: siteConfig.sitemap.changeFrequency.tagsIndex,
      priority: siteConfig.sitemap.priority.tagsIndex,
    },
    ...postUrls,
    ...tagUrls,
  ];
}

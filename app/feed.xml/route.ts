import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/site.config";

export async function GET() {
  const posts = await getAllPosts();

  const itemsXml = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.metadata.title}]]></title>
      <link>${siteConfig.url}${siteConfig.routes.posts}/${post.slug}</link>
      <guid isPermaLink="true">${siteConfig.url}${siteConfig.routes.posts}/${post.slug}</guid>
      <description><![CDATA[${post.metadata.description}]]></description>
      <pubDate>${new Date(post.metadata.date).toUTCString()}</pubDate>
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteConfig.name}</title>
    <link>${siteConfig.url}</link>
    <description>${siteConfig.description}</description>
    <language>${siteConfig.language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}${siteConfig.routes.feed}" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

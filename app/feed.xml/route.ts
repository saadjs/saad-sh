import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/site.config";

export const revalidate = 3600;

export async function GET() {
  const posts = await getAllPosts();
  const latestPostDate = posts[0] ? new Date(posts[0].metadata.date) : new Date(0);

  const itemsXml = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.metadata.title}]]></title>
      <link>${siteConfig.url}${siteConfig.routes.posts}/${post.slug}</link>
      <guid isPermaLink="true">${siteConfig.url}${siteConfig.routes.posts}/${post.slug}</guid>
      <description><![CDATA[${post.metadata.description}]]></description>
      <pubDate>${new Date(post.metadata.date).toUTCString()}</pubDate>
      <dc:creator><![CDATA[${siteConfig.author.name}]]></dc:creator>
      ${post.metadata.tags.map((tag) => `<category><![CDATA[${tag}]]></category>`).join("")}
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${siteConfig.name}</title>
    <link>${siteConfig.url}</link>
    <description>${siteConfig.description}</description>
    <language>${siteConfig.language}</language>
    <lastBuildDate>${latestPostDate.toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}${siteConfig.routes.feed}" rel="self" type="application/rss+xml"/>
    <generator>${siteConfig.name}</generator>
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

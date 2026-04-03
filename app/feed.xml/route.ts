import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/site.config";

export const revalidate = 3600;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapCdata(value: string) {
  return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

export async function GET() {
  const posts = await getAllPosts();
  const latestPostDate = posts[0] ? new Date(posts[0].metadata.date) : new Date(0);

  const itemsXml = posts
    .map(
      (post) => `
    <item>
      <title>${wrapCdata(post.metadata.title)}</title>
      <link>${escapeXml(`${siteConfig.url}${siteConfig.routes.posts}/${post.slug}`)}</link>
      <guid isPermaLink="true">${escapeXml(`${siteConfig.url}${siteConfig.routes.posts}/${post.slug}`)}</guid>
      <description>${wrapCdata(post.metadata.description)}</description>
      <pubDate>${new Date(post.metadata.date).toUTCString()}</pubDate>
      <dc:creator>${wrapCdata(siteConfig.author.name)}</dc:creator>
      ${post.metadata.tags.map((tag) => `<category>${wrapCdata(tag)}</category>`).join("")}
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${escapeXml(siteConfig.url)}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>${escapeXml(siteConfig.language)}</language>
    <lastBuildDate>${latestPostDate.toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${siteConfig.url}${siteConfig.routes.feed}`)}" rel="self" type="application/rss+xml"/>
    <generator>${escapeXml(siteConfig.name)}</generator>
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

import { createFileRoute } from '@tanstack/react-router'
import { getAllPosts, getAllTags } from '#/lib/posts'
import { siteConfig } from '#/site.config'
import { absoluteUrl, slugifyTag } from '#/lib/utils'

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

type UrlEntry = {
  url: string
  lastModified: Date
  changeFrequency: string
  priority: number
}

function toXmlEntry(entry: UrlEntry): string {
  return `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified.toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
}

async function renderSitemap(): Promise<Response> {
  const posts = await getAllPosts()
  const tags = await getAllTags()
  const latestPostDate = posts[0] ? new Date(posts[0].metadata.date) : new Date(0)
  const latestTagDates = new Map<string, Date>()

  for (const post of posts) {
    const postDate = new Date(post.metadata.date)
    for (const tag of post.metadata.tags) {
      const slug = slugifyTag(tag)
      if (!slug) continue
      const existing = latestTagDates.get(slug)
      if (!existing || postDate > existing) {
        latestTagDates.set(slug, postDate)
      }
    }
  }

  const entries: UrlEntry[] = [
    {
      url: absoluteUrl(siteConfig.routes.home, siteConfig.url),
      lastModified: latestPostDate,
      changeFrequency: siteConfig.sitemap.changeFrequency.home,
      priority: siteConfig.sitemap.priority.home,
    },
    {
      url: absoluteUrl(siteConfig.routes.about, siteConfig.url),
      lastModified: latestPostDate,
      changeFrequency: siteConfig.sitemap.changeFrequency.about,
      priority: siteConfig.sitemap.priority.about,
    },
    {
      url: absoluteUrl(siteConfig.routes.tags, siteConfig.url),
      lastModified: latestPostDate,
      changeFrequency: siteConfig.sitemap.changeFrequency.tagsIndex,
      priority: siteConfig.sitemap.priority.tagsIndex,
    },
    ...posts.map((post) => ({
      url: absoluteUrl(`${siteConfig.routes.posts}/${post.slug}`, siteConfig.url),
      lastModified: new Date(post.metadata.date),
      changeFrequency: siteConfig.sitemap.changeFrequency.post,
      priority: siteConfig.sitemap.priority.post,
    })),
    ...Array.from(tags.keys()).map((tag) => ({
      url: absoluteUrl(`${siteConfig.routes.tags}/${tag}`, siteConfig.url),
      lastModified: latestTagDates.get(tag) ?? latestPostDate,
      changeFrequency: siteConfig.sitemap.changeFrequency.tag,
      priority: siteConfig.sitemap.priority.tag,
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(toXmlEntry).join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => renderSitemap(),
    },
  },
})

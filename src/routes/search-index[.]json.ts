import { createFileRoute } from '@tanstack/react-router'
import type { PostMetadata } from '#/lib/types'
import { getPostModuleBySlug, getPostRawContent, getPostSlugs } from '#/lib/posts'

type SearchIndexEntry = {
  slug: string
  title: string
  description: string
  date: string
  tags: string[]
  image?: string
  excerpt: string
  searchText: string
}

function stripMarkdown(source: string): string {
  let text = source
  text = text.replace(/```[\s\S]*?```/g, ' ')
  text = text.replace(/`[^`]*`/g, ' ')
  text = text.replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '$1')
  text = text.replace(/^#{1,6}\s+/gm, '')
  text = text.replace(/^>\s?/gm, '')
  text = text.replace(/^[-*+]\s+/gm, '')
  text = text.replace(/^\d+\.\s+/gm, '')
  text = text.replace(/[*_~]/g, '')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

function makeExcerpt(text: string, length = 220): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim()
}

async function buildSearchIndex(): Promise<SearchIndexEntry[]> {
  const slugs = getPostSlugs()
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const mod = await getPostModuleBySlug(slug)
      if (!mod?.metadata?.published) return null
      const metadata = mod.metadata as PostMetadata
      const raw = await getPostRawContent(slug)
      const content = stripMarkdown(raw)
      const excerpt = makeExcerpt(content)
      const searchText =
        `${metadata.title} ${metadata.description} ${metadata.tags.join(' ')} ${content}`.toLowerCase()

      const entry: SearchIndexEntry = {
        slug,
        title: metadata.title,
        description: metadata.description,
        date: metadata.date,
        tags: metadata.tags,
        excerpt,
        searchText,
      }
      if (metadata.image) entry.image = metadata.image
      return entry
    }),
  )

  return entries
    .filter((entry): entry is SearchIndexEntry => entry !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const Route = createFileRoute('/search-index.json')({
  server: {
    handlers: {
      GET: async () => {
        const index = await buildSearchIndex()
        return new Response(JSON.stringify(index), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        })
      },
    },
  },
})

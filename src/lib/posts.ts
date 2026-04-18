import type { ComponentType } from 'react'
import type { Post, PostMetadata } from './types'
import { slugifyTag } from './utils'

type MdxModule = {
  default: ComponentType
  metadata: PostMetadata
}

const postModules = import.meta.glob<MdxModule>('../content/posts/*.mdx', {
  eager: false,
})

const postRawSources = import.meta.glob<string>('../content/posts/*.mdx', {
  query: '?raw',
  import: 'default',
  eager: false,
})

function slugFromPath(path: string): string {
  const match = path.match(/\/([^/]+)\.mdx$/)
  return match ? match[1] : ''
}

function modulesBySlug(): Record<string, () => Promise<MdxModule>> {
  const map: Record<string, () => Promise<MdxModule>> = {}
  for (const [path, loader] of Object.entries(postModules)) {
    const slug = slugFromPath(path)
    if (slug) map[slug] = loader
  }
  return map
}

function rawSourcesBySlug(): Record<string, () => Promise<string>> {
  const map: Record<string, () => Promise<string>> = {}
  for (const [path, loader] of Object.entries(postRawSources)) {
    const slug = slugFromPath(path)
    if (slug) map[slug] = loader
  }
  return map
}

const moduleMap = modulesBySlug()
const rawMap = rawSourcesBySlug()

export async function getPostModuleBySlug(slug: string): Promise<MdxModule | null> {
  const loader = moduleMap[slug]
  if (!loader) return null
  return loader()
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const mod = await getPostModuleBySlug(slug)
  if (!mod) return null
  return { slug, metadata: mod.metadata }
}

export async function getAllPosts(): Promise<Post[]> {
  const slugs = Object.keys(moduleMap)
  const entries = await Promise.all(slugs.map((slug) => getPostBySlug(slug)))
  const posts = entries.filter(
    (post): post is Post => Boolean(post && post.metadata.published),
  )
  return posts.sort(
    (a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime(),
  )
}

export async function getPostRawContent(slug: string): Promise<string> {
  const loader = rawMap[slug]
  if (!loader) return ''
  const raw = await loader()
  return raw.replace(/^export\s+const\s+metadata\s*=\s*\{[\s\S]*?\};\s*/m, '').trim()
}

export function getPostSlugs(): string[] {
  return Object.keys(moduleMap)
}

export async function getAllTags(): Promise<Map<string, { label: string; count: number }>> {
  const posts = await getAllPosts()
  const tagCounts = new Map<string, { label: string; count: number }>()

  for (const post of posts) {
    for (const tag of post.metadata.tags) {
      const slug = slugifyTag(tag)
      if (!slug) continue
      const existing = tagCounts.get(slug)
      if (existing) {
        existing.count += 1
      } else {
        tagCounts.set(slug, { label: tag.toUpperCase(), count: 1 })
      }
    }
  }

  return tagCounts
}

export async function getRelatedPosts(slug: string, limit = 3): Promise<Post[]> {
  const current = await getPostBySlug(slug)
  if (!current) return []

  const all = await getAllPosts()
  const currentTags = current.metadata.tags.map(slugifyTag)

  const scored = all
    .filter((p) => p.slug !== slug)
    .map((post) => {
      const shared = post.metadata.tags.filter((t) =>
        currentTags.includes(slugifyTag(t)),
      ).length
      return { post, shared }
    })
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.shared - a.shared)

  return scored.slice(0, limit).map((entry) => entry.post)
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts()
  const normalizedTag = slugifyTag(tag)
  return posts.filter((post) =>
    post.metadata.tags.some((t) => slugifyTag(t) === normalizedTag),
  )
}

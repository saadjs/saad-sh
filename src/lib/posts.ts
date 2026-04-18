import type { ComponentType } from 'react'

// TODO(before-merge): move MDX sources from `content/` into `src/content/` and update these globs.

export interface PostMetadata {
  title: string
  description: string
  date: string
  tags: string[]
  published: boolean
  image?: string
}

export interface Post {
  slug: string
  metadata: PostMetadata
  Component: ComponentType
}

type PostModule = {
  default: ComponentType
  metadata: PostMetadata
}

const postModules = import.meta.glob<PostModule>('/content/posts/*.mdx', {
  eager: true,
})

const aboutModules = import.meta.glob<{ default: ComponentType }>('/content/pages/about.mdx', {
  eager: true,
})

export function slugifyTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

export function getAllPosts() {
  const posts = Object.entries(postModules)
    .map(([path, module]) => {
      const slug = path.split('/').pop()?.replace(/\.mdx$/, '') ?? ''
      return { slug, metadata: module.metadata, Component: module.default }
    })
    .filter((post) => post.slug && post.metadata.published)

  return posts.sort(
    (a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime(),
  )
}

export function getPostBySlug(slug: string) {
  return getAllPosts().find((post) => post.slug === slug) ?? null
}

export function getTagMap() {
  const tags = new Map<string, { label: string; count: number }>()

  for (const post of getAllPosts()) {
    for (const tag of post.metadata.tags) {
      const normalized = slugifyTag(tag)
      if (!normalized) continue
      const current = tags.get(normalized)
      if (current) {
        current.count += 1
      } else {
        tags.set(normalized, { label: tag.toUpperCase(), count: 1 })
      }
    }
  }

  return tags
}

export function getPostsByTag(tag: string) {
  const normalized = slugifyTag(tag)
  return getAllPosts().filter((post) => post.metadata.tags.some((value) => slugifyTag(value) === normalized))
}

export function getAboutPage() {
  return aboutModules['/content/pages/about.mdx']?.default
}

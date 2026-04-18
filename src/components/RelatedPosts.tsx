import { Link } from '@tanstack/react-router'
import { formatDate } from '#/lib/utils'
import { siteConfig } from '#/site.config'
import type { Post } from '#/lib/types'

interface RelatedPostsProps {
  posts: Post[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        {siteConfig.postPage.relatedPostsHeading}
      </h2>
      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.slug} className="flex items-baseline gap-3">
            <Link
              to="/posts/$slug"
              params={{ slug: post.slug }}
              className="text-accent hover:underline"
            >
              {post.metadata.title}
            </Link>
            <time dateTime={post.metadata.date} className="text-sm text-faint shrink-0">
              {formatDate(post.metadata.date)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { PostCard } from '#/components/PostCard'
import { getAllPosts } from '#/lib/posts'
import { siteConfig } from '#/site.config'
import { absoluteUrl } from '#/lib/utils'

const postsQueryOptions = {
  queryKey: ['posts'] as const,
  queryFn: () => getAllPosts(),
}

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(postsQueryOptions)
  },
  head: () => ({
    meta: [
      { title: siteConfig.name },
      { property: 'og:title', content: siteConfig.name },
      { property: 'og:url', content: siteConfig.url },
    ],
    links: [{ rel: 'canonical', href: absoluteUrl(siteConfig.routes.home, siteConfig.url) }],
  }),
  component: HomePage,
})

function HomePage() {
  const { data: posts } = useSuspenseQuery(postsQueryOptions)

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          {siteConfig.homePage.postsEyebrow}
        </p>
      </div>
      {posts.length === 0 ? (
        <p className="text-muted">{siteConfig.homePage.emptyMessage}</p>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}

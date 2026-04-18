import { Link, createFileRoute } from '@tanstack/react-router'
import { getPostsByTag } from '../lib/posts'

export const Route = createFileRoute('/tags/$tag')({
  loader: ({ params }) => ({ tag: params.tag, posts: getPostsByTag(params.tag) }),
  component: TagPage,
})

function TagPage() {
  const { tag, posts } = Route.useLoaderData()

  return (
    <main className="page-wrap px-4 py-12">
      <h1 className="display-title mb-6 text-4xl font-bold">Posts tagged "{tag}"</h1>
      <div className="space-y-4">
        {posts.map((post) => (
          <article key={post.slug} className="island-shell rounded-2xl p-5">
            <h2 className="m-0 text-2xl font-semibold">
              <Link to="/posts/$slug" params={{ slug: post.slug }} className="no-underline hover:underline">
                {post.metadata.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">{post.metadata.description}</p>
          </article>
        ))}
      </div>
    </main>
  )
}

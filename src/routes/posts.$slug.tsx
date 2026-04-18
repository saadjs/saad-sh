import { createFileRoute, notFound } from '@tanstack/react-router'
import { getPostBySlug } from '../lib/posts'

export const Route = createFileRoute('/posts/$slug')({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug)
    if (!post) {
      throw notFound()
    }
    return post
  },
  component: PostPage,
})

function PostPage() {
  const post = Route.useLoaderData()

  return (
    <main className="page-wrap px-4 py-12">
      <article className="island-shell rounded-2xl p-6 sm:p-10">
        <p className="mb-2 text-xs uppercase tracking-wide text-[var(--sea-ink-soft)]">{post.metadata.date}</p>
        <h1 className="display-title mb-2 text-4xl font-bold">{post.metadata.title}</h1>
        <p className="mb-8 text-[var(--sea-ink-soft)]">{post.metadata.description}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <post.Component />
        </div>
      </article>
    </main>
  )
}

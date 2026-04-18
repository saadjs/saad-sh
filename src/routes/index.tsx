import { Link, createFileRoute } from '@tanstack/react-router'
import { getAllPosts } from '../lib/posts'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const posts = getAllPosts()

  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <h1 className="display-title mb-2 text-5xl font-bold">Software Development.</h1>
      <p className="mb-8 text-[var(--sea-ink-soft)]">Writing about TypeScript, AI tooling, web development, etc.</p>

      <section className="space-y-4">
        {posts.map((post) => (
          <article key={post.slug} className="island-shell rounded-2xl p-5">
            <p className="mb-2 text-xs uppercase tracking-wide text-[var(--sea-ink-soft)]">{post.metadata.date}</p>
            <h2 className="m-0 text-2xl font-semibold">
              <Link to="/posts/$slug" params={{ slug: post.slug }} className="no-underline hover:underline">
                {post.metadata.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">{post.metadata.description}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

import { Link, createFileRoute } from '@tanstack/react-router'
import { getTagMap } from '../lib/posts'

export const Route = createFileRoute('/tags')({ component: TagsPage })

function TagsPage() {
  const tags = [...getTagMap().entries()].sort((a, b) => b[1].count - a[1].count)

  return (
    <main className="page-wrap px-4 py-12">
      <h1 className="display-title mb-6 text-4xl font-bold">Tags</h1>
      <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {tags.map(([slug, tag]) => (
          <li key={slug}>
            <Link
              to="/tags/$tag"
              params={{ tag: slug }}
              className="island-shell block rounded-xl p-4 no-underline hover:-translate-y-0.5"
            >
              <span className="font-semibold text-[var(--sea-ink)]">{tag.label}</span>
              <span className="ml-2 text-sm text-[var(--sea-ink-soft)]">({tag.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { getAboutPage } from '../lib/posts'

export const Route = createFileRoute('/about')({ component: AboutPage })

function AboutPage() {
  const AboutContent = getAboutPage()

  if (!AboutContent) {
    return <main className="page-wrap px-4 py-12">About page content is unavailable.</main>
  }

  return (
    <main className="page-wrap px-4 py-12">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <AboutContent />
      </article>
    </main>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { getAllPosts, getTagMap } from '../lib/posts'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const posts = getAllPosts()
        const tags = [...getTagMap().keys()]

        const urls = [
          'https://saad.sh/',
          'https://saad.sh/about',
          'https://saad.sh/tags',
          ...posts.map((post) => `https://saad.sh/posts/${post.slug}`),
          ...tags.map((tag) => `https://saad.sh/tags/${tag}`),
        ]

        const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`

        return new Response(body, {
          headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        })
      },
    },
  },
})

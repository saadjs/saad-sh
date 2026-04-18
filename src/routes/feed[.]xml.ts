import { createFileRoute } from '@tanstack/react-router'
import { getAllPosts } from '../lib/posts'

export const Route = createFileRoute('/feed.xml')({
  server: {
    handlers: {
      GET: async () => {
        const posts = getAllPosts()
        const items = posts
          .map(
            (post) => `<item><title><![CDATA[${post.metadata.title}]]></title><link>https://saad.sh/posts/${post.slug}</link><description><![CDATA[${post.metadata.description}]]></description><pubDate>${new Date(post.metadata.date).toUTCString()}</pubDate></item>`,
          )
          .join('')

        const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>saad.sh</title><link>https://saad.sh</link><description>Writing about TypeScript, AI tooling, web development, etc.</description>${items}</channel></rss>`

        return new Response(body, {
          headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
        })
      },
    },
  },
})

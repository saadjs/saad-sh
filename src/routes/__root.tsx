import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'

import { Header } from '#/components/Header'
import { Footer } from '#/components/Footer'
import { SearchCommandClient } from '#/components/SearchCommandClient'
import { siteConfig } from '#/site.config'
import { absoluteUrl } from '#/lib/utils'
import TanStackQueryDevtools from '#/integrations/tanstack-query/devtools'

import appCss from '#/styles.css?url'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'application-name', content: siteConfig.name },
      { name: 'description', content: siteConfig.description },
      { name: 'author', content: siteConfig.author.name },
      { name: 'creator', content: siteConfig.author.name },
      { name: 'publisher', content: siteConfig.author.name },
      { name: 'category', content: 'technology' },
      { name: 'format-detection', content: 'telephone=no,address=no,email=no' },
      { name: 'robots', content: 'index,follow' },
      { title: siteConfig.name },
      { property: 'og:site_name', content: siteConfig.name },
      { property: 'og:title', content: siteConfig.name },
      { property: 'og:description', content: siteConfig.description },
      { property: 'og:url', content: siteConfig.url },
      { property: 'og:locale', content: siteConfig.locale },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: absoluteUrl('/opengraph-image', siteConfig.url) },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: siteConfig.name },
      { name: 'twitter:card', content: siteConfig.twitterCard },
      { name: 'twitter:title', content: siteConfig.name },
      { name: 'twitter:description', content: siteConfig.description },
      { name: 'twitter:image', content: absoluteUrl('/opengraph-image', siteConfig.url) },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'shortcut icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#ff6341' },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'alternate', type: 'application/rss+xml', href: siteConfig.routes.feed },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <section className="text-center">
        <p className="text-sm text-faint">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/" className="mt-6 inline-block text-accent hover:underline">
          Back to home
        </Link>
      </section>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang={siteConfig.language}>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <div className="mx-auto flex min-h-screen flex-col px-6 py-12 max-w-2xl sm:px-8 lg:max-w-3xl xl:max-w-4xl">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <SearchCommandClient />
        </div>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

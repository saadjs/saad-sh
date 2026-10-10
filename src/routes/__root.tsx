import { HeadContent, Link, ScriptOnce, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import { Header } from "#/components/Header";
import { Footer } from "#/components/Footer";
import { SearchCommandClient } from "#/components/SearchCommandClient";
import { siteConfig } from "#/site.config";
import { absoluteUrl, ogImagePath } from "#/lib/utils";
import { logoAccent } from "#/lib/logo";
import { themeInitScript } from "#/lib/theme";
import { HandNote } from "#/components/Sketch";

import { getFeatures } from "#/lib/features";

import appCss from "#/styles.css?url";

export const Route = createRootRoute({
  beforeLoad: async () => ({ features: await getFeatures() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "application-name", content: siteConfig.name },
      { name: "description", content: siteConfig.description },
      { name: "author", content: siteConfig.author.name },
      { name: "creator", content: siteConfig.author.name },
      { name: "publisher", content: siteConfig.author.name },
      { name: "category", content: "technology" },
      { name: "format-detection", content: "telephone=no,address=no,email=no" },
      { name: "robots", content: "index,follow" },
      { title: siteConfig.name },
      { property: "og:site_name", content: siteConfig.name },
      { property: "og:title", content: siteConfig.name },
      { property: "og:description", content: siteConfig.description },
      { property: "og:url", content: siteConfig.url },
      { property: "og:locale", content: siteConfig.locale },
      { property: "og:type", content: "website" },
      { property: "og:image", content: absoluteUrl(ogImagePath(), siteConfig.url) },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:alt", content: siteConfig.name },
      { name: "twitter:card", content: siteConfig.twitterCard },
      { name: "twitter:title", content: siteConfig.name },
      { name: "twitter:description", content: siteConfig.description },
      { name: "twitter:image", content: absoluteUrl(ogImagePath(), siteConfig.url) },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      ...["DMSans", "IBMPlexMono", "Caveat"].map((font) => ({
        rel: "preload",
        href: `/fonts/${font}.woff2`,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous" as const,
      })),
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: logoAccent },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "alternate", type: "application/rss+xml", href: siteConfig.routes.feed },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <section className="text-center">
        <HandNote className="text-[2.625rem]">404</HandNote>
        <h1 className="page-title mt-3">Page not found</h1>
        <p className="mt-4 text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/" className="pen-link mt-6 inline-flex min-h-11 items-center">
          Back to home
        </Link>
      </section>
    </div>
  );
}

function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[49rem] px-4 pt-5 pb-12 text-[1.0625rem] sm:px-8 sm:pt-11">
      <Header />
      <main className="min-w-0">{children}</main>
      <Footer />
      <SearchCommandClient />
    </div>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // The head script sets data-theme before React hydrates.
    <html lang={siteConfig.language} suppressHydrationWarning>
      <head>
        <ScriptOnce>{themeInitScript}</ScriptOnce>
        <HeadContent />
      </head>
      <body className="antialiased">
        <SiteShell>{children}</SiteShell>
        <TanStackDevtools
          config={{ position: "bottom-right" }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}

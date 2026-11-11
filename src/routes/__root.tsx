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
import { getSiteContext } from "#/lib/site-context";
import { getStyle } from "#/styles";
import { useStyle } from "#/styles/use-style";

import baseCss from "#/styles/base.css?url";

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const preview = (location.search as Record<string, unknown>).style;
    return getSiteContext(typeof preview === "string" ? preview : undefined);
  },
  head: ({ match }) => ({
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
      // Only the active style's stylesheet and fonts are ever requested.
      { rel: "stylesheet", href: baseCss },
      { rel: "stylesheet", href: getStyle(match.context.styleId).css },
      ...getStyle(match.context.styleId).fonts.map((font) => ({
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
        <p className="eyebrow">404</p>
        <h1 className="page-title mt-3">Page not found</h1>
        <p className="mt-4 text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/" className="ui-link mt-6 inline-flex min-h-11 items-center">
          Back to home
        </Link>
      </section>
    </div>
  );
}

function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <Header />
      <main className="site-main min-w-0">{children}</main>
      <Footer />
      <SearchCommandClient />
    </div>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const style = useStyle();
  return (
    // data-style picks the look. The head script sets data-theme before React
    // hydrates; data-theme-lock pins it for styles that have a single look.
    <html
      lang={siteConfig.language}
      data-style={style.id}
      data-theme-lock={style.themes === "both" ? undefined : style.themes}
      suppressHydrationWarning
    >
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

# AGENTS.md

Code Style and Architecture Guide for **saad.sh** (TanStack Start).

This project was migrated from Next.js 16 (App Router) to TanStack Start running
on Cloudflare Workers. It keeps the original routes, UX, and MDX blog system.
Cloudflare is the only third-party tool wired in — for hosting. No database,
auth, error-tracking, or PR-review tooling is configured.

## Scaffold & setup history

The project shell was originally generated with the TanStack CLI (for
Cloudflare deployment) and then merged on top of the existing blog. The
scaffold's partner add-ons (Neon, Drizzle, Sentry, Better Auth, TanStack Query,
CodeRabbit) have since been removed — the static MDX blog does not need them.

If you want them back later, re-run the CLI into a scratch dir and cherry-pick
the pieces you actually need:

```bash
npx @tanstack/cli@latest create my-tanstack-app --agent --deployment cloudflare \
  --add-ons <add-ons-you-want>
```

## Stack

- **TanStack Start** — framework (SSR, server functions, server routes).
- **TanStack Router** (file-based) — `src/routes/`.
- **React 19**, **Vite 8**, **Tailwind CSS 4** (`@tailwindcss/vite`).
- **MDX** via `@mdx-js/rollup` with `remark-gfm`, `rehype-slug`,
  `rehype-prism-plus`, `rehype-autolink-headings` (configured in
  `vite.config.ts`). Blog post metadata flows through MDX named exports
  (`export const metadata = {...}`).
- **Cloudflare Workers** (hosting) — `@cloudflare/vite-plugin` +
  `wrangler.jsonc`. Deploy with `npm run deploy`.

## Commands

```bash
npm install                     # Install deps

npm run dev                     # Dev server on localhost:3000
npm run build                   # Production build (Vite + Start)
npm run preview                 # Preview the built output
npm run start                   # Node production start (reads .output/server)
npm run deploy                  # Build and deploy to Cloudflare (wrangler)

npm run test                    # Vitest
npm run format                  # Prettier check
npm run format:fix              # Prettier write
```

## Routes

File-based routes in `src/routes/`:

| URL                            | File                             | Notes                                           |
| ------------------------------ | -------------------------------- | ----------------------------------------------- |
| `/`                            | `index.tsx`                      | Home — lists published posts                    |
| `/about`                       | `about.tsx`                      | Static MDX page (`src/content/pages/about.mdx`) |
| `/posts/$slug`                 | `posts.$slug.tsx`                | MDX post, JSON-LD, share menu, related posts    |
| `/posts/$slug/opengraph-image` | `posts.$slug.opengraph-image.ts` | Per-post SVG OG image                           |
| `/opengraph-image`             | `opengraph-image.ts`             | Site-wide SVG OG image                          |
| `/tags`                        | `tags.index.tsx`                 | All tags (alphabetical)                         |
| `/tags/$tag`                   | `tags.$tag.tsx`                  | Posts for a given tag                           |
| `/feed.xml`                    | `feed[.]xml.ts`                  | RSS 2.0 feed                                    |
| `/sitemap.xml`                 | `sitemap[.]xml.ts`               | XML sitemap                                     |
| `/robots.txt`                  | `robots[.]txt.ts`                | robots.txt                                      |
| `/search-index.json`           | `search-index[.]json.ts`         | Client-side search payload                      |

The literal-dot route filenames (`feed[.]xml.ts`, `sitemap[.]xml.ts`, etc.) use
TanStack Router's bracket escape so the URL path keeps the dot.

## Content System

Blog posts are MDX files in `src/content/posts/`. Each post exports a
`metadata` object:

```typescript
export const metadata = {
  title: string;
  description: string;
  date: string;        // ISO format: "2026-01-31"
  tags: string[];
  published: boolean;  // Only published posts appear on site
  image?: string;      // Optional OG image
};
```

`src/lib/posts.ts` loads posts via Vite's `import.meta.glob` (no `fs`), so it
works on Cloudflare Workers where Node's `fs` is unavailable.

## Environment variables

None are required for the blog. `.env.example` is kept as a placeholder for
future secrets; copy to `.env.local` for local dev and use
`wrangler secret put <NAME>` to set production secrets on Cloudflare.

## Deployment (Cloudflare Workers)

`wrangler.jsonc` points at `@tanstack/react-start/server-entry` with
`nodejs_compat`. Ship with:

```bash
wrangler login    # once
npm run deploy
```

## Migration notes (Next.js → TanStack Start)

Adapted from https://tanstack.com/start/latest/docs/framework/react/migrate-from-next-js.

| Next.js                         | TanStack Start equivalent                                        |
| ------------------------------- | ---------------------------------------------------------------- |
| `app/<route>/page.tsx`          | `src/routes/<route>.tsx` (file-based)                            |
| `app/layout.tsx`                | `src/routes/__root.tsx` (shellComponent)                         |
| `app/not-found.tsx`             | `notFoundComponent` on the root route                            |
| `app/<route>/route.ts`          | `createFileRoute(...).server.handlers.GET/POST`                  |
| `generateMetadata`              | `head()` on the route                                            |
| `generateStaticParams`          | Not currently wired — prerender via Start's prerender config     |
| `next/link` `Link`              | `@tanstack/react-router` `Link` (`to=` + `params=`)              |
| `next/image` `Image`            | Plain `<img>` (no built-in image optimization on Workers)        |
| `next/font`                     | Dropped — system font stack in `src/styles.css`                  |
| `next/navigation` `usePathname` | `useRouterState({ select: s => s.location.pathname })`           |
| `next/navigation` `useRouter`   | `useRouter()` from `@tanstack/react-router` + `navigate(...)`    |
| `next/og` `ImageResponse`       | `src/lib/og-image.ts` emits an SVG (see gotchas below)           |
| `fs` in server code             | `import.meta.glob` + `?raw` for MDX content                      |
| Server Components by default    | Client components — server work goes in loaders / server fns     |
| `@next/mdx`                     | `@mdx-js/rollup` in `vite.config.ts`, same rehype/remark plugins |

## Known gotchas / follow-ups

- **OG images are SVG, not PNG.** `next/og` used Satori + WASM via
  `@vercel/og`. On Cloudflare Workers that stack isn't a drop-in, so
  `src/lib/og-image.ts` returns a hand-rolled SVG with the same dimensions and
  content. OG scrapers generally accept SVG, but if you want PNG parity the
  options are `workers-og` or running an external image service.
- **`generateStaticParams` was not ported.** The old app statically generated
  every `/posts/[slug]` and `/tags/[tag]` at build time. TanStack Start renders
  these on demand (SSR on Cloudflare). If you want static prerendering back,
  configure Start's prerender entries.
- **Vercel Analytics / Speed Insights removed.** They were Vercel-platform
  specific. Re-introduce via `@vercel/analytics` on a Vercel deploy, or use
  Cloudflare Web Analytics instead.
- **`eslint.config.mjs` and `postcss.config.mjs` were removed** (they were
  Next-specific). Add back if you want an ESLint/PostCSS setup.
- **`mdx-components.tsx` moved** from repo root to `src/mdx-components.tsx`
  and is referenced as `providerImportSource: '#/mdx-components'` in
  `vite.config.ts`.

## Style Guide

- TypeScript with strict mode enabled.
- Functional React components with hooks.
- Tailwind CSS for styling, utility-first.
- MDX for blog content with custom components.
- SEO via route `head()` and structured data (JSON-LD on post pages).
- Accessibility (semantic HTML, ARIA where needed).
- Mobile-first responsive design.
- Dark/light mode via CSS variables + `prefers-color-scheme` (no manual toggle).

## Git

- Commit messages follow Conventional Commits format.
- Branches named by feature or fix.
- Atomic commits.
- Ensure tests + format pass before merging.

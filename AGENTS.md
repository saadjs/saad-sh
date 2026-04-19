# AGENTS.md

Code Style and Architecture Guide for **saad.sh** (TanStack Start).

Personal blog built with TanStack Start on Cloudflare Workers, with an MDX blog
system. Cloudflare is the only third-party tool wired in — for hosting. No
database, auth, error-tracking, or PR-review tooling is configured.

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

## Known gotchas / follow-ups

- **OG images are SVG, not PNG.** `src/lib/og-image.ts` returns a hand-rolled
  SVG. OG scrapers generally accept SVG, but if you want PNG parity the options
  are `workers-og` or running an external image service.
- **No static prerendering.** `/posts/[slug]` and `/tags/[tag]` render on
  demand (SSR on Cloudflare). If you want static prerendering, configure
  Start's prerender entries.
- **`mdx-components.tsx` lives at `src/mdx-components.tsx`** and is referenced
  as `providerImportSource: '#/mdx-components'` in `vite.config.ts`.

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

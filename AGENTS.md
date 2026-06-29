# AGENTS.md

Project guide for **saad.sh**.

Personal blog built with TanStack Start on Cloudflare Workers. Content is MDX,
routes are file-based, and Cloudflare is the only deployed third-party service.
No database, auth, analytics, or error-tracking service is configured.

## Stack

- **TanStack Start** with **TanStack Router** file-based routes in `src/routes/`.
- **React 19**, **TypeScript**, **Vite 8**.
- **Tailwind CSS 4** via `@tailwindcss/vite`.
- **MDX** via `@mdx-js/rollup` with `remark-gfm`, `rehype-slug`,
  `rehype-prism-plus`, and `rehype-autolink-headings` in `vite.shared.ts`.
- **Cloudflare Workers** via `@cloudflare/vite-plugin`, `wrangler.jsonc`, and
  the custom Worker entrypoint at `src/server.ts`.

## Commands

```bash
pnpm install       # Install deps
pnpm dev           # Dev server on localhost:3000
pnpm build         # Production build + typecheck
pnpm preview       # Preview the Workers build locally
pnpm test          # Vitest
pnpm lint          # oxlint
pnpm lint:fix      # oxlint --fix
pnpm format        # oxfmt check
pnpm format:fix    # oxfmt write
pnpm run deploy    # Build and deploy to Cloudflare
```

## Routes

File-based routes live in `src/routes/`.

| URL                            | File                             | Notes                                           |
| ------------------------------ | -------------------------------- | ----------------------------------------------- |
| `/`                            | `index.tsx`                      | Home — lists published posts                    |
| `/about`                       | `about.tsx`                      | Static MDX page (`src/content/pages/about.mdx`) |
| `/projects`                    | `projects.tsx`                   | Projects page                                   |
| `/posts/$slug`                 | `posts.$slug.tsx`                | MDX post, JSON-LD, share menu, related posts    |
| `/posts/$slug/opengraph-image` | `posts.$slug.opengraph-image.ts` | Per-post SVG OG image                           |
| `/opengraph-image`             | `opengraph-image.ts`             | Site-wide SVG OG image                          |
| `/tags`                        | `tags.index.tsx`                 | All tags                                        |
| `/tags/$tag`                   | `tags.$tag.tsx`                  | Posts for a tag                                 |
| `/feed.xml`                    | `feed[.]xml.ts`                  | RSS 2.0 feed                                    |
| `/sitemap.xml`                 | `sitemap[.]xml.ts`               | XML sitemap                                     |
| `/robots.txt`                  | `robots[.]txt.ts`                | robots.txt                                      |
| `/search-index.json`           | `search-index[.]json.ts`         | Client-side search payload                      |

Literal-dot route filenames use TanStack Router bracket escaping, e.g.
`feed[.]xml.ts` maps to `/feed.xml`.

## Content

Blog posts are MDX files in `src/content/posts/`. Each post exports metadata:

```typescript
export const metadata = {
  title: string;
  description: string;
  date: string; // ISO format: "2026-01-31"
  tags: string[];
  published: boolean;
  image?: string;
};
```

`src/lib/posts.ts` loads posts with Vite `import.meta.glob`; do not use Node
`fs` for content loading because the app runs on Cloudflare Workers.

## Deployment

`wrangler.jsonc` points at `src/server.ts` with `nodejs_compat`. The Worker
handles canonical-host and trailing-slash redirects before delegating to
TanStack Start.

Deploy with:

```bash
pnpm exec wrangler whoami
pnpm exec wrangler login # if needed
pnpm run deploy
```

## Notes

- OG images are generated as SVG in `src/lib/og-image.ts`.
- There is no static prerendering configured; dynamic post and tag pages render
  on demand.
- `src/mdx-components.tsx` is the MDX component provider referenced by
  `providerImportSource: "#/mdx-components"`.

## Style

- Keep TypeScript strict and avoid unnecessary runtime dependencies.
- Use functional React components and hooks.
- Prefer semantic HTML and accessible interactions.
- Use Tailwind utilities and existing CSS variables.
- Preserve the automatic dark/light mode behavior based on
  `prefers-color-scheme`; there is no manual theme toggle.
- Use route `head()` metadata and structured data where relevant.

## Git

- Keep commits atomic and use Conventional Commits when committing.
- Run format, lint, tests, and build before merging when practical.

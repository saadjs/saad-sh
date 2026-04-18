# AGENTS.md

Code Style and Architecture Guide for **saad.sh** (TanStack Start).

This project was migrated from Next.js 16 (App Router) to TanStack Start running
on Cloudflare Workers. It keeps the original routes, UX, and MDX blog system;
partner integrations (Neon, Drizzle, Sentry, Better Auth, TanStack Query) are
scaffolded alongside so they are ready to use.

## Scaffold & setup history

The project shell was generated with the TanStack CLI and then merged on top of
the existing content:

```bash
# Fresh scaffold in a scratch dir
npx @tanstack/cli@latest create my-tanstack-app --agent --deployment cloudflare \
  --add-ons neon,drizzle,sentry,better-auth,tanstack-query

# Install TanStack Intent skills and list what's available
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
```

Re-run the `intent` commands after `npm install` in the merged project so Intent
can actually see the installed packages (the scratch scaffold's `npm install`
step failed, so `intent list` initially returned nothing - that's fine).

See `.cta.json` for the record of add-ons chosen.

## Stack

- **TanStack Start** - framework (SSR, server functions, server routes).
- **TanStack Router** (file-based) - `src/routes/`.
- **TanStack Query** - data fetching; SSR-integrated via
  `@tanstack/react-router-ssr-query`. See `src/integrations/tanstack-query/`.
- **TanStack CLI** - scaffold + `.cta.json` metadata.
- **TanStack Intent** - skill mappings in this file
  (`<!-- intent-skills:start -->` block below).
- **React 19**, **Vite 8**, **Tailwind CSS 4** (`@tailwindcss/vite`).
- **MDX** via `@mdx-js/rollup` with `remark-gfm`, `rehype-slug`,
  `rehype-prism-plus`, `rehype-autolink-headings` (configured in
  `vite.config.ts`). Blog post metadata flows through MDX named exports
  (`export const metadata = {...}`).
- **Neon** (Postgres serverless) + **Drizzle ORM** - `src/db/` and
  `drizzle.config.ts`; `vite-plugin-neon-new` auto-provisions a dev DB via
  Neon Launchpad.
- **Better Auth** - `src/lib/auth.ts`, `src/lib/auth-client.ts`, with the
  handler route at `src/routes/api/auth/$.ts`.
- **Sentry** - `@sentry/tanstackstart-react`, initialised in
  `instrument.server.mjs` (loaded via `NODE_OPTIONS=--import ...` in `dev`).
- **Cloudflare** - `@cloudflare/vite-plugin` + `wrangler.jsonc`. Deploy with
  `npm run deploy`.
- **CodeRabbit** - configured via `.coderabbit.yaml`. Install the GitHub App
  (https://github.com/apps/coderabbitai) on `saadjs/saad-sh` to activate.

Demo routes under `src/routes/demo/*` exercise each partner integration
(`/demo/neon`, `/demo/drizzle`, `/demo/sentry/testing`, `/demo/better-auth`,
`/demo/tanstack-query`).

## Commands

```bash
npm install                     # Install deps

npm run dev                     # Dev server on localhost:3000
npm run build                   # Production build (Vite + Start)
npm run preview                 # Preview the built output
npm run start                   # Node production start (reads .output/server)
npm run deploy                  # Build and deploy to Cloudflare (wrangler)

npm run test                    # Vitest
npm run lint                    # ESLint
npm run format                  # Prettier check
npm run format:fix              # Prettier write

npm run db:generate             # Drizzle: generate SQL from schema changes
npm run db:migrate              # Drizzle: apply migrations
npm run db:push                 # Drizzle: push schema directly (dev)
npm run db:pull                 # Drizzle: introspect existing DB
npm run db:studio               # Drizzle Studio
```

## Routes

File-based routes in `src/routes/`:

| URL                              | File                                     | Notes                                                |
| -------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| `/`                              | `index.tsx`                              | Home - lists published posts via TanStack Query      |
| `/about`                         | `about.tsx`                              | Static MDX page (`src/content/pages/about.mdx`)      |
| `/posts/$slug`                   | `posts.$slug.tsx`                        | MDX post, JSON-LD, share menu, related posts         |
| `/posts/$slug/opengraph-image`   | `posts.$slug.opengraph-image.ts`         | Per-post SVG OG image                                |
| `/opengraph-image`               | `opengraph-image.ts`                     | Site-wide SVG OG image                               |
| `/tags`                          | `tags.index.tsx`                         | All tags (alphabetical)                              |
| `/tags/$tag`                     | `tags.$tag.tsx`                          | Posts for a given tag                                |
| `/feed.xml`                      | `feed[.]xml.ts`                          | RSS 2.0 feed                                         |
| `/sitemap.xml`                   | `sitemap[.]xml.ts`                       | XML sitemap                                          |
| `/robots.txt`                    | `robots[.]txt.ts`                        | robots.txt                                           |
| `/search-index.json`             | `search-index[.]json.ts`                 | Client-side search payload                           |
| `/api/auth/$`                    | `api/auth/$.ts`                          | Better Auth handler (catch-all)                      |
| `/demo/*`                        | `demo/*.tsx`                             | Partner integration demos                            |

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

See `.env.example`. Create `.env.local` (git-ignored) with real values before
`npm run dev`. The `dev` script loads it via `dotenv-cli`.

| Variable                | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`          | Postgres URL used by Drizzle/Neon and the /demo/drizzle route |
| `DATABASE_URL_POOLER`   | Pooled Neon URL (optional)                                  |
| `BETTER_AUTH_URL`       | e.g. `http://localhost:3000` in dev                         |
| `BETTER_AUTH_SECRET`    | `npx -y @better-auth/cli secret`                            |
| `VITE_SENTRY_DSN`       | Enables Sentry on the client                                |
| `VITE_SENTRY_ORG`       | Sentry org slug                                             |
| `VITE_SENTRY_PROJECT`   | Sentry project slug                                         |
| `SENTRY_AUTH_TOKEN`     | Required for source map upload at build                     |

For Cloudflare production deploys, set these as secrets with
`wrangler secret put <NAME>`.

## Deployment (Cloudflare Workers)

`wrangler.jsonc` points at `@tanstack/react-start/server-entry` with
`nodejs_compat`. Ship with:

```bash
wrangler login          # once
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET
# ...etc for each secret
npm run deploy
```

## Partner integrations

| Partner        | How it's wired                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Neon           | `vite-plugin-neon-new` in `vite.config.ts` (`neon-vite-plugin.ts`); `src/db.ts` neon serverless client. |
| Drizzle        | `drizzle.config.ts`, `src/db/schema.ts`, `src/db/index.ts`, migrations in `./drizzle`.                  |
| Sentry         | `instrument.server.mjs` loaded via `NODE_OPTIONS`; client via `@sentry/tanstackstart-react`.            |
| Better Auth    | `src/lib/auth.ts`, `src/routes/api/auth/$.ts`, header UI at `src/integrations/better-auth/header-user.tsx`. |
| TanStack Query | `src/integrations/tanstack-query/root-provider.tsx` provides the `queryClient`; routes use it via `ensureQueryData`. |
| Cloudflare     | `@cloudflare/vite-plugin`, `wrangler.jsonc`, `npm run deploy`.                                          |
| CodeRabbit     | `.coderabbit.yaml`. **Install the GitHub App** at https://github.com/apps/coderabbitai for it to run.   |

CodeRabbit has no runtime SDK in this app - it is GitHub App tooling for PR
reviews. Do not add runtime code for it.

## Migration notes (Next.js -> TanStack Start)

Adapted from https://tanstack.com/start/latest/docs/framework/react/migrate-from-next-js.

| Next.js                          | TanStack Start equivalent                                       |
| -------------------------------- | ---------------------------------------------------------------- |
| `app/<route>/page.tsx`           | `src/routes/<route>.tsx` (file-based)                            |
| `app/layout.tsx`                 | `src/routes/__root.tsx` (shellComponent)                         |
| `app/not-found.tsx`              | `notFoundComponent` on the root route                            |
| `app/<route>/route.ts`           | `createFileRoute(...).server.handlers.GET/POST`                  |
| `generateMetadata`               | `head()` on the route                                            |
| `generateStaticParams`           | Not currently wired - prerender via Start's prerender config     |
| `next/link` `Link`               | `@tanstack/react-router` `Link` (`to=` + `params=`)              |
| `next/image` `Image`             | Plain `<img>` (no built-in image optimization on Workers)        |
| `next/font`                      | Dropped - system font stack in `src/styles.css`                  |
| `next/navigation` `usePathname`  | `useRouterState({ select: s => s.location.pathname })`           |
| `next/navigation` `useRouter`    | `useRouter()` from `@tanstack/react-router` + `navigate(...)`    |
| `next/og` `ImageResponse`        | `src/lib/og-image.ts` emits an SVG (see gotchas below)           |
| `fs` in server code              | `import.meta.glob` + `?raw` for MDX content                      |
| Server Components by default     | Client components - server work goes in loaders / server fns     |
| `@next/mdx`                      | `@mdx-js/rollup` in `vite.config.ts`, same rehype/remark plugins |

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
- **Scaffold npm install failed in the scratch dir**, so the real install
  happens here. Run `npm install` then `npx @tanstack/intent@latest list`
  again - Intent reads from `node_modules`.
- **Partner integrations are scaffolded but not load-bearing for the blog.**
  Neon/Drizzle/Better Auth/Sentry live alongside the blog with demo routes;
  the static MDX blog itself does not require them. If you want to strip them
  back out later, the demo routes and `src/db*`, `src/lib/auth*`,
  `src/integrations/better-auth/` are the pieces to remove.
- **`eslint.config.mjs` and `postcss.config.mjs` were removed** (they were
  Next-specific). Add back if you want a non-default ESLint setup.
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
- Ensure tests + lint pass before merging.

<!-- intent-skills:start -->
# Skill mappings - when working in these areas, load the linked skill file into context.
# Run `npx @tanstack/intent@latest list` after `npm install` to confirm each path resolves;
# skills are shipped inside `node_modules/<package>/skills/...` by their host packages.
skills:
  - task: "Add or change a TanStack Router route (file naming, loaders, params, search)"
    # To load this skill, run: npx @tanstack/intent@latest list | grep router
  - task: "Wire up a new TanStack Query hook or SSR prefetch for a route"
    # To load this skill, run: npx @tanstack/intent@latest list | grep query
  - task: "Add a Start server function, server route handler, or API route"
    # To load this skill, run: npx @tanstack/intent@latest list | grep start
  - task: "Change Drizzle schema, add a migration, or touch `/demo/drizzle`"
    # To load this skill, run: npx @tanstack/intent@latest list | grep drizzle
  - task: "Update Better Auth configuration, sign-in/sign-out UX, or the catch-all route"
    # To load this skill, run: npx @tanstack/intent@latest list | grep auth
<!-- intent-skills:end -->

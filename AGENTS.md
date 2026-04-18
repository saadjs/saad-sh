# AGENTS.md

## Project overview
This repository is a personal blog migrated from Next.js App Router to **TanStack Start (React)**.

## Migration bootstrap commands (executed)
```bash
npx @tanstack/cli@latest create my-tanstack-app --agent --deployment cloudflare --add-ons neon,drizzle,sentry,better-auth,tanstack-query
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
```

## Current stack and integrations
- Framework/runtime: TanStack Start + TanStack Router + React 19
- Content: MDX via Vite `@mdx-js/rollup`
- Deployment target: Cloudflare (`@cloudflare/vite-plugin`, `wrangler.jsonc`)
- CLI/tooling: TanStack CLI, TanStack Intent

## Removed integrations (intentionally)
The following partner/tool integrations were removed per project direction:
- neon
- drizzle
- sentry
- better-auth
- coderabbit

## Environment variables
No third-party partner secrets are required in the current app baseline.

## Deployment
- Build: `npm run build`
- Deploy: `npm run deploy` (wrangler)
- Ensure Cloudflare project + secrets are configured before deploy.

## Architecture
- File-based routes in `src/routes`
- Shared layout shell in `src/routes/__root.tsx`
- Blog/content loader utilities in `src/lib/posts.ts`
- MDX content lives in `content/posts` and `content/pages`

## Known gotchas
- TanStack CLI `--template saas` was not resolvable in this environment (no template registry configured), so migration used scaffold output from the required command and then pruned unused integrations.

## Next steps
1. Re-introduce post metadata OG/social image generation.
2. Add end-to-end checks for key routes (`/`, `/about`, `/tags`, `/posts/:slug`).
3. Keep dependency set minimal and only add integrations when actively used.

# saad.sh (TanStack Start)

Personal blog migrated from Next.js App Router to **TanStack Start (React)**, deployed on Cloudflare.

## Bootstrapping command used

```bash
npx @tanstack/cli@latest create my-tanstack-app --agent --deployment cloudflare --add-ons neon,drizzle,sentry,better-auth,tanstack-query
```

## Current stack

- TanStack Start + TanStack Router
- MDX content rendering
- Cloudflare hosting/deployment

## What was intentionally removed

Per current project requirements, these partner integrations were removed:
- Neon
- Drizzle
- Sentry
- Better Auth
- CodeRabbit

## Development

```bash
npm install
npm run dev
npm run build
npm run deploy
```

## Migrated routes

- `/`
- `/about`
- `/tags`
- `/tags/:tag`
- `/posts/:slug`
- `/feed.xml`
- `/sitemap.xml`
- `/robots.txt`

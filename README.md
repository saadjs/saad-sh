# saad.sh

Personal blog built with TanStack Start, React, TypeScript, Tailwind CSS, and
Cloudflare Workers. Posts are Markdown; static pages use MDX.

## Local development

Install Node.js and pnpm 12.5.1, then run:

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

## Editing content

Write posts in `src/content/posts/<slug>.md`; the URL is `/posts/<slug>`.
Keep existing filenames to preserve links. Required frontmatter uses JSON syntax:

```markdown
---
title: "My new post"
description: "A short summary."
date: "2026-10-08"
tags: ["TypeScript", "Tools"]
published: true
---

Write the post in Markdown here.
```

Use a valid `YYYY-MM-DD` date; `image` is an optional string. Set `published: false`
to hide a post from the site. Keep private drafts outside this public repository.
Review locally, run the checks below, then commit and push to deploy via Cloudflare
Builds. Builds validate post filenames, frontmatter, and Markdown.

- Static pages: `src/content/pages/`
- Site copy and metadata: `src/site.config.ts`
- Projects: `src/lib/projects.ts`
- Shared social card: run `pnpm og`, then review and commit `public/og/site.png`.

## Checks

```bash
pnpm format
pnpm lint
pnpm test
pnpm build
```

After changing Worker bindings, variables, or the compatibility date,
run `pnpm cf-typegen` and commit `worker-configuration.d.ts`.

## Deployment

Configure the Worker in [wrangler.jsonc](wrangler.jsonc). Set
`PNPM_VERSION=12.5.1` in Cloudflare Builds. For manual deployment, log in with
`pnpm exec wrangler login` if needed, run the checks, then:

```bash
pnpm run deploy
```

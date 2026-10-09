# saad.sh

Personal blog built with TanStack Start, React, TypeScript, Tailwind CSS, and
Cloudflare Workers.
Posts are Markdown files in `src/content/posts/`. Commit and push changes to
trigger the Cloudflare build and deployment that makes them live.
MDX is used for static pages such as About.

## Local development

With Node.js and pnpm installed (the project pins pnpm 12.5.1 in `package.json`):

Cloudflare Builds should use `PNPM_VERSION=12.5.1` to match the project. Older
pnpm versions may ignore workspace overrides and reject the frozen lockfile;
`.npmrc` enables version switching for pnpm 9 using the `packageManager` pin.
Vitest stays on 4.x until the Cloudflare Workers test adapter supports 5.x.
TypeScript stays on 6.x because 7.x rejects the recursive HAST types returned
through TanStack Start server functions.

```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm exec wrangler d1 migrations apply saad-sh-newsletter --local
pnpm dev
```

Open <http://localhost:3000>. Local newsletter D1 is separate from production.

Worker secrets belong in the git-ignored `.dev.vars` file. Replace the newsletter signing
secret placeholder with a random string. Newsletter email delivery
requires a real `RESEND_API_KEY`; the example Turnstile key is for testing.
`RESEND_AUDIENCE_ID` is configured in [wrangler.jsonc](wrangler.jsonc), and
newsletter sender addresses and the production Turnstile site key are in
[src/site.config.ts](src/site.config.ts).

## Editing content

Write posts in `src/content/posts/<slug>.md`. The filename determines the URL
(`/posts/<slug>`); keep existing filenames to preserve links. Each post starts
with frontmatter whose values use JSON syntax:

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

`title`, `description`, `date`, `tags`, and `published` are required. `image` is
an optional string. Use a valid `YYYY-MM-DD` date. Set `published: false` to
exclude a post from public pages, Markdown downloads, search, feeds, and sitemap.
Files committed to the public repository remain visible there, so keep private
drafts outside the repository. Post files are excluded from automatic formatting
to preserve their Markdown and code samples as authored.

Run `pnpm dev` to review locally, run the checks, then commit and push.
Builds validate post filenames, frontmatter, and Markdown before deployment. Cloudflare
Builds deploys the repo content; posts need no database writes or editor login.
The archive, tags, feed, sitemap, search, and Markdown endpoints read the same
bundled files. To unpublish, set `published: false`; to remove a post, delete its
file and deploy.

Static pages such as About use MDX in `src/content/pages/`. Site copy and metadata
live in `src/site.config.ts`, and project entries live in `src/lib/projects.ts`.

### Social cards

Every page uses the same committed PNG at `public/og/site.png`. Publishing posts
uses the deployment workflow and needs no image generation. Builds and deployments use the existing
file and do not query D1 for social cards.

To update the shared artwork after changing the site branding or card layout,
run `pnpm og`, review and commit `public/og/site.png`, then deploy. Generation runs
locally and requires no Cloudflare account access.

The site self-hosts DM Sans and IBM Plex Mono in `public/fonts/`, including
italic faces. The WOFF2 files are Latin subsets from Google Fonts; other scripts
use the system fallbacks. Their licenses are included as
[DM Sans OFL](public/fonts/DMSans-OFL.txt) and
[IBM Plex Mono OFL](public/fonts/IBMPlexMono-OFL.txt). No font requests go to
third-party services at runtime.

Social cards use Geist and Geist Mono from
[Vercel's Geist v1.7.2 release](https://github.com/vercel/geist-font/releases/tag/v1.7.2),
using the static TTF files in `scripts/fonts/`, so generation needs no system fonts or
font downloads. The original web fonts remain in `public/fonts/`. The
[SIL Open Font License](public/fonts/OFL.txt) covers the Geist and Geist Mono
files in both directories. After updating these font files, regenerate the shared card
with `pnpm og`.

## Checks

```bash
pnpm format
pnpm lint
pnpm test
pnpm build
```

After changing Worker bindings, variables, secret names, or the compatibility
date, run `pnpm cf-typegen` and commit `worker-configuration.d.ts`.

## Deployment

The Worker and D1 bindings are configured in [wrangler.jsonc](wrangler.jsonc).
`NEWSLETTER_DB` stores newsletter consent and redeemed tokens. Resend handles
newsletter email and contacts, and Cloudflare Turnstile protects signup.

Check Cloudflare account access (`pnpm exec wrangler login` if needed), apply
remote migrations, and inspect the configured secrets:

```bash
pnpm exec wrangler whoami
pnpm exec wrangler d1 migrations apply saad-sh-newsletter --remote
pnpm exec wrangler secret list
```

Set any missing secrets with `pnpm exec wrangler secret put <NAME>`:

- `RESEND_API_KEY`
- `NEWSLETTER_SIGNING_SECRET`
- `TURNSTILE_SECRET_KEY`

Use production credentials and a random newsletter signing secret. Run the checks
above, then deploy:

```bash
pnpm run deploy
```

This builds and deploys the Worker, including the committed shared social card.

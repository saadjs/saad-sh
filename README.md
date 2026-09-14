# saad.sh

Personal blog built with TanStack Start, React, TypeScript, Tailwind CSS, and
Cloudflare Workers.
Posts live in D1 and are edited through a passkey-protected `/admin` editor.
MDX is used for static pages such as About.

## Local development

With Node.js and pnpm installed:

```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm exec wrangler d1 migrations apply saad-sh-newsletter --local
pnpm exec wrangler d1 migrations apply saad-sh-content --local
pnpm content:seed
pnpm dev
```

Open <http://localhost:3000>. Local D1 is separate from production;
`pnpm content:seed` adds sample posts without overwriting existing posts and
refuses `--remote`.

Worker secrets belong in the git-ignored `.dev.vars` file. Replace the signing
secret placeholders with separate random strings. Newsletter email delivery
requires a real `RESEND_API_KEY`; the example Turnstile key is for testing.
`RESEND_AUDIENCE_ID` is configured in [wrangler.jsonc](wrangler.jsonc), and
newsletter sender addresses and the production Turnstile site key are in
[src/site.config.ts](src/site.config.ts).

In another terminal, create a local passkey enrollment link:

```bash
pnpm admin:enroll
```

Open the printed link on the device holding the passkey. It is single-use and
expires after 15 minutes. Sign in at `/admin/login` to access `/admin`; protected
admin routes return 404 when signed out. Manage passkeys at `/admin/settings`.

## Editing content

D1 is the source of truth. Create, edit, and publish Markdown posts in `/admin`.
Production posts are not stored in the repository. Edits autosave to a separate
draft; publishing makes that draft live and removes it from the drafts table.
Saves have no revision history. Shareable preview links cover one post, expire
after seven days, and are excluded from caching and search indexing.

Static pages such as About use MDX in `src/content/pages/`. Site copy and metadata
live in `src/site.config.ts`, and project entries live in `src/lib/projects.ts`.

### Exports

Export current, non-deleted posts as Markdown for portability:

```bash
pnpm content:export --remote
```

Each export creates a new directory under git-ignored `exports/`. It includes
unpublished posts, but not editor drafts, deleted posts, or authentication data;
it is not a full database backup. There is no production import/sync command.
Omit `--remote` to export local D1.

### Social cards

Social cards remain static PNGs in `public/og/`. Generate them directly from
production D1 metadata with `pnpm run og --remote` (omit `--remote` for local D1).
Generation replaces the card set with the selected database's published posts.
`pnpm run deploy` generates production cards before building and deploying;
plain builds and commit hooks do not query D1. Review and commit changed cards
after generation. Production generation requires Cloudflare account access.

Publishing updates the post immediately. New or changed social cards reach the
website on the next deployment; posts without cards use the site card meanwhile.

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
`CONTENT_DB` stores posts, drafts, and admin authentication;
`NEWSLETTER_DB` stores newsletter consent and redeemed tokens. Resend handles
newsletter email and contacts, and Cloudflare Turnstile protects signup.

Check Cloudflare account access (`pnpm exec wrangler login` if needed), apply
remote migrations, and inspect the configured secrets:

```bash
pnpm exec wrangler whoami
pnpm exec wrangler d1 migrations apply saad-sh-newsletter --remote
pnpm exec wrangler d1 migrations apply saad-sh-content --remote
pnpm exec wrangler secret list
```

Set any missing secrets with `pnpm exec wrangler secret put <NAME>`:

- `RESEND_API_KEY`
- `NEWSLETTER_SIGNING_SECRET`
- `TURNSTILE_SECRET_KEY`
- `PREVIEW_SIGNING_SECRET`

Use production credentials and separate random signing secrets. Run the checks
above, then deploy:

```bash
pnpm run deploy
```

This generates production social cards, builds, and deploys the Worker. Review
and commit any generated card changes.

For production admin access, run `pnpm admin:enroll --remote` and open the printed
link. Keep two passkeys on different devices; the app refuses removal of the
last passkey. Recovery after losing all devices requires Cloudflare account
access to remove stale credentials and enroll again.

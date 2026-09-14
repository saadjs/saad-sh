# saad.sh

Personal blog built with TanStack Start, Tailwind CSS, and Cloudflare Workers.
Posts live in D1 and are edited through a passkey-protected `/admin` editor.
MDX is used for static pages such as About.

## Dev

```bash
pnpm install
pnpm exec wrangler d1 migrations apply saad-sh-newsletter --local
pnpm exec wrangler d1 migrations apply saad-sh-content --local
pnpm content:seed
pnpm dev
```

Run `pnpm admin:enroll` to register a local passkey. Edits autosave as drafts;
Publish makes them live. Local D1 is separate from production.

## Content and social cards

D1 is the source of truth. Create, edit, and publish posts in `/admin`.
Production posts are not stored in the repository. `pnpm content:seed` adds
sample posts to local D1 without overwriting existing posts; it refuses `--remote`.

Export current, non-deleted posts as Markdown for portability:

```bash
pnpm content:export --remote
```

Each export creates a new directory under git-ignored `exports/`. It includes
unpublished posts, but not editor drafts, deleted posts, or authentication data;
it is not a full database backup. There is no production import/sync command.

Social cards remain static PNGs in `public/og/`. Generate them directly from
production D1 metadata with `pnpm run og --remote` (omit `--remote` for local D1).
Generation replaces the card set with the selected database's published posts.
`pnpm run deploy` generates production cards before building and deploying;
plain builds and commit hooks do not query D1. Review and commit changed cards
after generation. Production generation requires Cloudflare account access.

Publishing updates the post immediately. New or changed social cards reach the
website on the next deployment; posts without cards use the site card meanwhile.

See [AGENTS.md](AGENTS.md) for configuration, authentication, and deployment.

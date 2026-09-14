# AGENTS.md

**saad.sh** is a personal blog built with TanStack Start, React, TypeScript,
Tailwind CSS, and Cloudflare Workers. Posts live in D1 and are edited through a
passkey-protected `/admin`. Cloudflare and Resend are the only deployed
third-party services.

## Working agreements

- Ask clarifying questions when the request is ambiguous; continue independent
  work while waiting. Use judgment for routine implementation choices.
- Complete the requested change and relevant verification, including fixing
  failures caused by the change. Report the result, checks, and any blocker.
  Local edits and affected test reruns do not need separate approval.
- Match checks to the change: affected tests for behavior changes, a formatting
  check for documentation. Before merging code, run `pnpm format`, `pnpm lint`,
  `pnpm test`, and `pnpm build` when practical.
- Use atomic Conventional Commits when committing.

## Task references

- For local setup, content exports, and social-card generation, use `README.md`.
  Scripts and dependency versions are in `package.json`.
- For routing and metadata, use `src/routes/`. Literal dots use bracket escaping
  (`feed[.]xml.ts`); parameters with a suffix use braces (`posts.{$slug}[.]md.ts`).
  `src/server.ts` handles redirects, the admin gate, and preview headers before
  the router.
- For database or Worker configuration, use `wrangler.jsonc`. Content and auth
  migrations are in `migrations/content/`; newsletter migrations are in
  `migrations/`.

## Content and rendering constraints

- `CONTENT_DB` (`saad-sh-content`) is the source of truth; edit and publish through
  `/admin`. Read posts through `src/lib/posts.ts` inside a `createServerFn` handler
  or `server.handlers` block. Bare route loaders also run on the client and cannot
  access D1.
- Autosave writes to `drafts`; public reads use `posts`. Publishing renders and
  copies the draft to `posts`, then deletes the draft. Saves have no revision
  history. Exports omit editor drafts and are not full database backups.
- When changing `src/lib/markdown.ts`, bump `RENDER_VERSION` for pipeline changes
  so cached `hast` re-renders. Keep output aligned with the static-page MDX
  pipeline in `vite.shared.ts`; MDX is scoped to `src/content/pages/`.
- Signed previews cover one slug for seven days and must remain `no-store` and
  `noindex`.
- OG cards are committed PNGs in `public/og/`. Generation replaces the card set
  with the selected database's published posts; review and commit generated
  changes. Preserve the manifest-based site-card fallback for posts without a
  card. Layout and generation live in `src/lib/og-image.ts` and
  `scripts/generate-og-images.ts`.

## Authentication constraints

- Preserve passkey-only auth and the allowed hosts in `src/lib/admin-auth.ts`:
  `saad.sh` and local development hosts.
- Unauthenticated admin requests return 404 except for `PUBLIC_ADMIN_PATHS` in
  `src/server.ts`. Protected handlers also call `denyUnlessAdmin`; mutations
  require a matching `Origin`.
- Sessions use opaque random IDs; D1 stores only their SHA-256 hashes.
- Preserve `counterIsValid` in `src/lib/webauthn.ts`: synced passkeys may always
  report zero. Require an increasing counter only after a credential has reported
  a nonzero counter.
- Refuse removal of the last passkey and warn when only one remains. Prefer two
  passkeys on different devices.
- `pnpm admin:enroll [--remote]` creates a single-use, 15-minute enrollment link.
  Cloudflare account access is the recovery root of trust; recovery after losing
  all devices requires removing stale credentials and enrolling again.

## Cloudflare operations

- Use explicit `--local` or `--remote` for Wrangler D1 commands; the databases are
  separate. `NEWSLETTER_DB` (`saad-sh-newsletter`) stores consent and redeemed
  tokens. `pnpm content:seed` is local-only; tests use dedicated fixtures.
- After changing bindings, vars, secret names, or `compatibility_date`, run
  `pnpm cf-typegen` and include `worker-configuration.d.ts`. Declare secret names
  in `wrangler.jsonc` under `secrets.required`; document required configuration in
  `.dev.vars.example`. The experimental-field warning is expected.
- For a requested deployment, check `pnpm exec wrangler whoami` and log in if
  needed, apply required remote migrations, and check `wrangler secret list`
  before setting missing secrets. Run `pnpm run deploy`, which generates
  production OG cards, builds, and deploys. Plain builds and commit hooks do not
  query D1.

## UI conventions

Use existing components, Tailwind utilities, and CSS variables. Preserve
accessible interactions, automatic light/dark mode via `prefers-color-scheme`,
and appropriate route metadata and structured data. Avoid unnecessary runtime
dependencies.

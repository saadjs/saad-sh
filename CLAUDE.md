# saad.sh

Personal blog: TanStack Start, React 19, TypeScript, Tailwind v4, Cloudflare Workers.
Humans: see [README.md](README.md). This file is the map for coding agents.

## Commands

| Task                   | Command                         |
| ---------------------- | ------------------------------- |
| Dev server (port 3000) | `pnpm dev`                      |
| Type-check             | `pnpm exec tsc --noEmit`        |
| Lint / format          | `pnpm lint` / `pnpm format:fix` |
| Tests                  | `pnpm test`                     |
| Full build             | `pnpm build`                    |
| New site style         | `pnpm style:new <id>`           |

Run type-check, lint, format and tests before calling work done.

## Where things live

| What                                       | Where                                            |
| ------------------------------------------ | ------------------------------------------------ |
| Site copy, nav, metadata                   | `src/site.config.ts` (no copy in components)     |
| Posts (Markdown)                           | `src/content/posts/<slug>.md`                    |
| Projects list                              | `src/lib/projects.ts`                            |
| Routes (data loading + shared page markup) | `src/routes/`                                    |
| Shared components                          | `src/components/`                                |
| **Site styles (looks)**                    | `src/styles/`, start with `src/styles/README.md` |
| Which styles are on, default, picker       | `src/styles/index.ts`                            |
| Fonts (self-hosted)                        | `public/fonts/`                                  |

## The one architectural rule

The site has several switchable looks. **Pages are written once; styles only
dress them.**

- A style is a folder `src/styles/<id>/` with `index.tsx` and `style.css`. It
  may only import from `#/styles/kit` and may not edit anything outside its folder.
- Shared markup uses the class names and tokens documented in
  `src/styles/README.md`; `src/styles/base.css` gives each a token-based default.
- **Adding a feature:** build it once in shared markup, give new elements a
  class and a default in `base.css`, and it works in every style. Never branch
  on the style id in a component or route.
- **Changing how something looks in one style:** edit that style's `style.css`.
- Preview any style with `?style=<id>` on any URL.

## Conventions

- Visible dates are ISO `YYYY-MM-DD` via `formatDate`.
- No emoji in UI. Touch targets at least 44px. Text contrast at least 4.5:1.
- Comments explain why, not what.
- Do not commit unless asked.

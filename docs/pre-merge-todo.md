# Pre-merge TODOs (follow-up file moves)

This checklist captures **follow-up file moves** that should happen before finalizing the migration branch.

- [ ] Move `content/posts/*` to a runtime-owned location (suggestion: `src/content/posts/*`) and update `src/lib/posts.ts` glob imports.
- [ ] Move `content/pages/about.mdx` to `src/content/pages/about.mdx` and update `src/lib/posts.ts` accordingly.
- [ ] Move `site.config.ts` into `src/config/site.ts` (or remove it if no longer used).
- [ ] Decide whether `public/site.webmanifest` is still needed now that `public/manifest.json` is the active manifest.
- [ ] If static image assets are reintroduced later, place them under a consistent path (`public/static/images/`) and document ownership in README.

## Why these are follow-up items

The current PR focuses on migration and cleanup; these moves are organizational and can be completed in a small follow-up PR to reduce merge risk.

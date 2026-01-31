# AGENTS.md

Code Style and Architecture Guide

## Commands

```bash
pnpm dev          # Start development server at localhost:3000
pnpm build        # Build for production (also validates static generation)
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
pnpm format:fix   # Fix formatting issues with Prettier
```

## Architecture

This is a minimalistic personal blog for **saad.sh** built with Next.js 16 (App Router), MDX, and Tailwind CSS 4.
Global metadata, navigation, and routes are centralized in `site.config.ts`.

## Style Guide

- TypeScript with strict mode enabled.
- Functional React components with hooks.
- Tailwind CSS for styling, using utility-first approach.
- MDX for blog content with custom components.
- SEO best practices with metadata, structured data, and sitemap.
- Accessibility considerations (semantic HTML, ARIA where needed).
- Mobile-first responsive design.

### Content System

Blog posts are MDX files in `content/posts/`. Each post exports a `metadata` object:

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

### Key Files

- `lib/posts.ts` - Post fetching utilities (getAllPosts, getPostBySlug, getPostSlugs, getAllTags, getPostsByTag)
- `lib/types.ts` - Post metadata/type definitions
- `mdx-components.tsx` - Custom MDX component styles (root level, required by Next.js)
- `next.config.ts` - MDX configuration via `@next/mdx`
- `site.config.ts` - Site metadata, routes, navigation, SEO, and sitemap settings
- `app/feed.xml/route.ts` - RSS feed generator
- `app/robots.ts` - Robots metadata route
- `app/sitemap.ts` - Sitemap metadata route

### Routes

- `/` - Homepage listing all published posts
- `/posts/[slug]` - Individual post (dynamic MDX import, JSON-LD structured data)
- `/tags` - All tags with post counts
- `/tags/[tag]` - Posts filtered by tag
- `/sitemap.xml`, `/robots.txt`, `/feed.xml` - SEO endpoints

### Styling

Dark/light mode uses CSS variables in `app/globals.css` with `prefers-color-scheme`. No manual toggle - follows system preference.
Typography uses Geist fonts via `next/font` in `app/layout.tsx`.

## Git

- Commit messages follow Conventional Commits format.
- Branches are named by feature or fix (e.g., `feat/add-new-post`, `fix/mdx-parsing`).
- Pull requests should reference related issues and include testing instructions.
- Code reviews focus on functionality, readability, and adherence to coding standards.
- Each commit should be atomic and focused on a single change.
- Ensure all tests pass and linting checks succeed before merging.

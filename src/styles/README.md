# Site styles

The site ships several complete looks ("styles"). A visitor gets one per page
load; the server picks it from a cookie, so the page renders in the right look
with no flash and only that style's CSS and fonts are downloaded.

## The control panel

Everything is decided in [index.ts](index.ts):

| I want to…                     | Do this                                            |
| ------------------------------ | -------------------------------------------------- |
| Change the default style       | `styleConfig.default = "<id>"`                     |
| Give new visitors a random one | `styleConfig.default = "random"`                   |
| Lock the site to one style     | `styleConfig.picker = false` (hides the menu)      |
| Disable a style                | Add its id to `styleConfig.disabled`               |
| Remove a style for good        | Delete its line and import, then delete its folder |
| Add a style                    | `pnpm style:new <id>`                              |
| Preview a style without saving | Open any page with `?style=<id>`                   |

## How a style is built

A style is one folder, `src/styles/<id>/`, with two files:

- `index.tsx` exports a `StyleDefinition` ([types.ts](types.ts)): name, fonts,
  light/dark support, a `Home` component and, optionally, a `ProjectCard`.
- `style.css` sets the design tokens and overrides shared classes.

Nothing else in the codebase knows a style exists. Pages, routes, data loading,
search, sharing and the newsletter form are written once and shared.

### What is shared and what is yours

| Part                                | Markup                 | How a style changes it          |
| ----------------------------------- | ---------------------- | ------------------------------- |
| Header, nav, footer                 | shared                 | CSS; `nav` renames the links    |
| Post page, table of contents, pager | shared                 | CSS                             |
| Post lists, tags, about, newsletter | shared                 | CSS                             |
| Home page                           | **the style's `Home`** | your own JSX (or `DefaultHome`) |
| One project on the projects page    | style's `ProjectCard`  | your own JSX (or the default)   |

Import everything you need from `#/styles/kit`. Do not import from elsewhere in
`src/` inside a style folder; if something is missing, add it to the kit.

### Tokens

Set these on `:root` in `style.css`. [base.css](base.css) has the defaults.

| Token                                          | Meaning                                           |
| ---------------------------------------------- | ------------------------------------------------- |
| `--background`, `--surface`                    | Page ground; panels, inputs, buttons              |
| `--foreground`, `--muted`, `--faint`           | Text, secondary text, decoration only             |
| `--border`                                     | Hairlines                                         |
| `--accent`, `--accent-fg`                      | Links and primary buttons; text on the accent     |
| `--radius`                                     | Corner radius of panels and buttons               |
| `--font-body`, `--font-heading`, `--font-code` | Font stacks                                       |
| `--site-width`, `--page-width`, `--measure`    | Shell, ordinary page, running text                |
| `--prose-size`                                 | Font size of post text                            |
| `--code-*`                                     | Code colours; derived from the palette by default |

Tailwind utilities read the same tokens: `bg-background`, `bg-surface`,
`text-foreground`, `text-muted`, `text-accent`, `border-border`, `font-sans`,
`font-display`, `font-mono`.

Dark mode: add a `:root[data-theme="dark"]` block. A style with one fixed look
sets `themes: "light"` or `"dark"`, defines one palette, and the toggle hides
itself. If the fixed look is dark, also set `color-scheme: dark` on `:root`.

### Shared classes

Put overrides inside `@layer components { … }` so Tailwind utilities still win.

- Shell: `.site`, `.site-header`, `.site-brand`, `.site-brand-mark`,
  `.site-brand-suffix`, `.site-nav` (current link has `aria-current="page"`),
  `.site-tools`, `.site-main`, `.site-footer`, `.site-tabbar` (the phone tab
  bar; links hold `.site-tabbar-icon` and `.site-tabbar-label`, the current
  one has `aria-current="page"`, and `data-hidden="true"` is set while the
  reader scrolls down)
- Pages: `.page`, `.page-head`, `.eyebrow`, `.page-title`, `.page-intro`,
  `.section-title`, `.about-portrait` (the picture above the About
  heading)
- Small parts: `.ui-panel` (in-page boxes), `.ui-popover` (floating menus and the
  search dialog; must stay opaque), `.ui-menu-item` (a row in a popover menu), `.ui-btn`, `.ui-btn-primary`, `.ui-input`,
  `.ui-link`, `.ui-chip`, `.ui-rule`
- Post lists: `.post-list`, `.post-row`, `.post-row-date`, `.post-row-main`,
  `.post-row-title`, `.post-row-desc` and `.post-row-tag` (both hidden until a
  style sets `display`), `.year-group`, `.year-title`
- Post page: `.post-page`, `.post-header`, `.post-meta`, `.post-title`,
  `.post-title-text`, `.post-reading-time`, `.post-progress` (the reading
  progress bar along the top edge), `.post-desc`, `.post-actions`, `.toc-rail` (hidden by default), `.toc-inline`,
  `.toc-label`, `.toc-list`, `.post-body`, `.code-block`, `.code-block-bar`
  (its buttons are styled through `.code-block-bar button`),
  `.post-pager`, `.post-pager-label`, `.post-pager-title`
- Post demos (interactive `<post-demo name="…">` embeds, see
  `src/components/PostDemo.tsx`): `.post-demo` (the frame; also sets
  `--demo-code`, `--demo-model`, `--demo-agent`, `--demo-human`, the colours of
  the step-kind markers), `.demo-kind[data-kind]`, `.demo-kind-icon[data-kind]`
  (line icons in tags and diagram nodes), `.demo-json` (Prism `.token` spans), `.demo-io`,
  `.demo-toggle`, `.demo-event[data-status]`, `.demo-meter`, `.demo-tab`.
  Diagrams are hand-drawn SVG `.demo-flow` (rough.js, Excalifont via
  `--font-sketch`, set on `.post-demo`): nodes `.demo-flow-node[data-kind][data-state]`
  built from `.demo-sketch-base`, `.demo-sketch-hachure` and `.demo-sketch-line`;
  edges `.demo-sketch-edge[data-taken|data-back]` holding `.demo-flow-edge` and
  `.demo-flow-arrowhead`,
  `.demo-flow-badge`; `.demo-flow-wrap` holds a wide and a tall layout and
  shows one by width
- Projects: `.projects-page`, `.project-grid` (the item named by the URL hash
  has `data-current`), `.project-card`, `.project-name`,
  `.project-desc`, `.project-tags`, `.project-links`
- Style menu: `.style-menu` (keeps a plain look in every style; leave it alone
  unless it is unreadable on your palette)

`<html>` carries `data-style="<id>"` and `data-theme="light|dark"`.

### Phones

Below 40rem the header keeps the brand and the tools on one row, and the page
links move to `.site-tabbar`, fixed to the bottom edge. That switch is layout,
not a look: it lives outside the layers at the end of [base.css](base.css) and
holds in every style. Dress the bar like any other shared class; it takes its
colours from the tokens and its indicator shape from `--radius`. Its labels
are always the plain ones from `siteConfig.nav`, since renamed ones
(`nav` in the style definition) can be too long for a tab.

### Motion

Navigating between pages cross-fades, and a post's title travels between its
list row and the post page (`postTitleTransition` in `src/lib/transitions.ts`,
which `PostList` and the post header apply). If a style's `Home` shows a post
title outside `PostList` and wants it to travel too, it needs that helper in
the kit first. Never name the same post twice on one page: the browser skips
the whole transition. All of it is off under `prefers-reduced-motion`.

### Fonts

Fonts are self-hosted in `public/fonts/`. Declare each one with `@font-face` in
`style.css` and list the one or two used above the fold in `fonts` so they are
preloaded. To add a font, drop the `.woff2` and its licence file in
`public/fonts/`.

## Rules that keep this maintainable

1. A style only edits files in its own folder.
2. Change the look in CSS first. Write JSX only for `Home` and `ProjectCard`.
3. A new feature goes into shared markup with a class name and a token-based
   default in `base.css`. It then works in every style on day one; styles can
   polish it later.
4. Body text stays readable: at least 16px, 4.5:1 contrast, touch targets 44px.
5. `test/scripts/styles.test.ts` checks every registered style against this contract.

[ledger/](ledger/) is the reference implementation.

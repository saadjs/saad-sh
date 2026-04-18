import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { cloudflare } from '@cloudflare/vite-plugin'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '#/mdx-components',
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypePrismPlus, { ignoreMissing: true }],
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append',
              properties: { className: ['heading-anchor'] },
            },
          ],
        ],
      }),
    },
    tanstackStart(),
    viteReact(),
  ],
})

export default config

import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrismPlus from "rehype-prism-plus";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { Plugin, PluginOption } from "vite";

export function startPlugins(): PluginOption[] {
  return [
    tailwindcss(),
    mdx({
      include: /\.mdx$/,
      providerImportSource: "#/mdx-components",
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypePrismPlus, { ignoreMissing: true }],
        [
          rehypeAutolinkHeadings,
          {
            behavior: "append",
            properties: { className: ["heading-anchor"] },
          },
        ],
      ],
    }) as Plugin,
    tanstackStart(),
    viteReact(),
  ];
}

import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@mdx-js/rollup";
import type { Plugin } from "vite";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrismPlus from "rehype-prism-plus";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { cloudflare } from "@cloudflare/vite-plugin";

function skipRawQuery(plugin: Plugin): Plugin {
  const originalTransform = plugin.transform;
  return {
    ...plugin,
    enforce: "pre",
    transform:
      typeof originalTransform === "function"
        ? function (this: unknown, code: string, id: string, options?: unknown) {
            if (id.includes("?raw")) return null;
            return (originalTransform as Function).call(this, code, id, options);
          }
        : originalTransform,
  };
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    skipRawQuery(
      mdx({
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
    ),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;

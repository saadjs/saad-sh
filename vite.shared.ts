import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrismPlus from "rehype-prism-plus";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { Plugin, PluginOption } from "vite";

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

export function startPlugins(): PluginOption[] {
  return [
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
  ];
}

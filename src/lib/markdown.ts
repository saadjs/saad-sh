import type { Element, Root, RootContent } from "hast";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrismPlus from "rehype-prism-plus";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export const RENDER_VERSION = 1;

type Parent = Root | Element;

type RawNode = { type: "raw"; value: string };
type Child = RootContent | RawNode;

function isWhitespace(value: string): boolean {
  return value.trim() === "";
}

function collapseRawIndentation() {
  return (tree: Root) => {
    const walk = (node: Parent) => {
      for (const child of node.children as Child[]) {
        if (child.type === "raw" && !child.value.includes("<pre")) {
          child.value = child.value.replace(/>\s*\n\s*</g, "><");
        } else if (child.type === "element") {
          walk(child);
        }
      }
    };
    walk(tree);
  };
}

function normalizeBlockWhitespace() {
  return (tree: Root) => {
    const walk = (node: Parent) => {
      if (node.type === "element" && node.tagName === "pre") return;

      const next: RootContent[] = [];
      for (const child of node.children) {
        const previous = next.at(-1);
        if (child.type === "text" && isWhitespace(child.value) && child.value.includes("\n")) {
          if (previous?.type === "text" && isWhitespace(previous.value)) continue;
          next.push({ ...child, value: "\n" });
          continue;
        }
        if (child.type === "element") walk(child);
        next.push(child);
      }

      if (node.type === "root") {
        while (next[0]?.type === "text" && isWhitespace(next[0].value)) next.shift();
        while (
          next.at(-1)?.type === "text" &&
          isWhitespace((next.at(-1) as { value: string }).value)
        )
          next.pop();
      }

      node.children = next;
    };
    walk(tree);
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(collapseRawIndentation)
  .use(rehypeRaw)
  .use(normalizeBlockWhitespace)
  .use(rehypeSlug)
  .use(rehypePrismPlus, { ignoreMissing: true })
  .use(rehypeAutolinkHeadings, {
    behavior: "append",
    properties: { className: ["heading-anchor"] },
  });

export async function renderMarkdown(body: string): Promise<Root> {
  return processor.run(processor.parse(body)) as Promise<Root>;
}

export function parseHast(serialized: string): Root {
  return JSON.parse(serialized) as Root;
}

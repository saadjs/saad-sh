import type { Root } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { Components } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMDXComponents } from "#/mdx-components";

export function PostBody({ hast }: { hast: Root }) {
  return toJsxRuntime(hast, {
    Fragment,
    jsx,
    jsxs,
    components: useMDXComponents() as Components,
  });
}

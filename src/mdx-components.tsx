import { ContentImage } from "#/components/ContentImage";
import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "#/components/CopyCodeButton";
import { ContentLink } from "#/components/ContentLink";

// Typography for running text lives in CSS under `.post-body` (base.css, then
// each style's style.css), so these stay limited to behaviour.
const defaultComponents: MDXComponents = {
  img: ContentImage,
  ContentImage,
  a: ContentLink,
  pre: ({ children, className, ...props }) => (
    <CodeBlock {...props} className={className}>
      {children}
    </CodeBlock>
  ),
  table: ({ children }) => (
    <div className="table-wrap ui-panel">
      <table>{children}</table>
    </div>
  ),
};

export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return { ...defaultComponents, ...components };
}

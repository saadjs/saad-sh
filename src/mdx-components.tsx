import { ContentImage } from "#/components/ContentImage";
import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "#/components/CopyCodeButton";
import { ContentLink } from "#/components/ContentLink";

const defaultComponents: MDXComponents = {
  img: ContentImage,
  ContentImage,
  h1: ({ children, ...props }) => (
    <h1
      {...props}
      className={`mt-12 mb-4 scroll-mt-24 text-[2rem] leading-tight font-semibold tracking-[-0.03em] text-foreground ${props.className ?? ""}`.trim()}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      {...props}
      className={`squiggle mt-14 mb-5 scroll-mt-24 text-[1.875rem] leading-[1.15] font-semibold tracking-[-0.03em] text-foreground ${props.className ?? ""}`.trim()}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      {...props}
      className={`mt-9 mb-2 scroll-mt-24 text-[1.375rem] leading-tight font-semibold tracking-[-0.02em] text-foreground ${props.className ?? ""}`.trim()}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="my-5 leading-[1.7] text-foreground">{children}</p>,
  a: ContentLink,
  ul: ({ children }) => (
    <ul className="sketch-list my-5 ml-6 list-none space-y-2.5 text-foreground">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-5 ml-6 list-decimal space-y-2.5 text-foreground marker:font-mono marker:text-[0.8125rem] marker:text-muted">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-dashed border-accent pl-5 leading-7 italic text-muted">
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }) => {
    const isBlockCode = className?.includes("language-");
    return (
      <code
        {...props}
        className={
          isBlockCode
            ? `font-mono text-sm ${className ?? ""}`.trim()
            : `rounded-[5px] bg-[var(--code-bg)] px-1.5 py-0.5 font-mono text-[0.88em] text-foreground ${className ?? ""}`.trim()
        }
      >
        {children}
      </code>
    );
  },
  pre: ({ children, className, ...props }) => (
    <CodeBlock {...props} className={className}>
      {children}
    </CodeBlock>
  ),
  hr: () => <hr className="sketch-rule my-10 border-0" />,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  table: ({ children }) => (
    <div className="sketch-box sketch-box-alt my-7 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[0.9375rem] leading-snug">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b-[1.6px] border-foreground">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b-[1.4px] border-dashed border-border last:border-b-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left font-mono text-xs font-normal text-muted">{children}</th>
  ),
  td: ({ children }) => <td className="px-4 py-3 text-foreground">{children}</td>,
};

export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return { ...defaultComponents, ...components };
}

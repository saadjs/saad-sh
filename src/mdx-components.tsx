import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "#/components/CopyCodeButton";

export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    h1: ({ children, ...props }) => (
      <h1
        {...props}
        className={`mt-12 mb-5 scroll-mt-24 text-3xl font-semibold tracking-tight text-foreground ${props.className ?? ""}`.trim()}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        {...props}
        className={`mt-12 mb-5 scroll-mt-24 text-2xl font-semibold tracking-tight text-foreground ${props.className ?? ""}`.trim()}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        {...props}
        className={`mt-10 mb-4 scroll-mt-24 text-xl font-semibold tracking-tight text-foreground ${props.className ?? ""}`.trim()}
      >
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="my-5 text-[1.0625rem] leading-[1.8] text-foreground">{children}</p>
    ),
    a: ({ href, children, className }) => (
      <a
        href={href}
        className={`text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent ${className ?? ""}`.trim()}
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="my-5 ml-6 list-disc space-y-2 text-foreground">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-5 ml-6 list-decimal space-y-2 text-foreground">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-7">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-2 border-border pl-5 text-[0.95rem] leading-7 italic text-muted">
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
              : `rounded bg-border px-1.5 py-0.5 font-mono text-sm text-foreground ${className ?? ""}`.trim()
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
    hr: () => <hr className="my-8 border-border" />,
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    table: ({ children }) => (
      <div className="my-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
    th: ({ children }) => (
      <th className="px-4 py-3 text-left font-semibold text-foreground">{children}</th>
    ),
    td: ({ children }) => <td className="px-4 py-3 text-foreground">{children}</td>,
    ...components,
  };
}

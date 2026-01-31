import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mt-8 mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-8 mb-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 mb-3 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="my-4 leading-7 text-zinc-700 dark:text-zinc-300">{children}</p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-4 transition-colors hover:decoration-zinc-600 dark:text-zinc-100 dark:decoration-zinc-500 dark:hover:decoration-zinc-300"
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="my-4 ml-6 list-disc space-y-2 text-zinc-700 dark:text-zinc-300">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-4 ml-6 list-decimal space-y-2 text-zinc-700 dark:text-zinc-300">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-7">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-2 border-zinc-300 pl-6 italic text-zinc-600 dark:border-zinc-600 dark:text-zinc-400">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="my-6 overflow-x-auto rounded-lg bg-zinc-100 p-4 font-mono text-sm dark:bg-zinc-800 [&_code]:bg-transparent [&_code]:p-0">
        {children}
      </pre>
    ),
    hr: () => <hr className="my-8 border-zinc-200 dark:border-zinc-700" />,
    strong: ({ children }) => (
      <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    table: ({ children }) => (
      <div className="my-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="border-b border-zinc-200 dark:border-zinc-700">{children}</thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-zinc-100 dark:border-zinc-800">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{children}</td>
    ),
    ...components,
  };
}

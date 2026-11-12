import type { ReactNode } from "react";
import { KIND_LABEL, type StepKind } from "./model";

export function DemoFrame({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <figure className="post-demo" aria-label={title}>
      <figcaption className="demo-head">
        <span className="demo-title">{title}</span>
        <span className="demo-intro">{intro}</span>
      </figcaption>
      {children}
    </figure>
  );
}

// Line icons on a 24-unit grid, stroked in the kind's colour. Shape tells the
// kinds apart where the two LLM kinds share the accent colour.
const KIND_ICON: Record<StepKind, ReactNode> = {
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />,
  model: (
    <path d="M12 3c.6 4.6 3.4 7.4 8 8.2-4.6.8-7.4 3.6-8 8.2-.6-4.6-3.4-7.4-8-8.2 4.6-.8 7.4-3.6 8-8.2z" />
  ),
  agent: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6l2.5 2.5" />
      <path d="M20.5 3.5v5h-5" />
    </>
  ),
  human: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 7 0 0 1 16 0" />
    </>
  ),
};

/**
 * A step-kind icon. Inside a diagram pass x, y and size in SVG units; in HTML
 * leave them out and it sizes to the text.
 */
export function KindIcon({
  kind,
  x,
  y,
  size,
}: {
  kind: StepKind;
  x?: number;
  y?: number;
  size?: number;
}) {
  return (
    <svg
      className="demo-kind-icon"
      data-kind={kind}
      viewBox="0 0 24 24"
      x={x}
      y={y}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {KIND_ICON[kind]}
    </svg>
  );
}

export function KindTag({ kind }: { kind: StepKind }) {
  return (
    <span className="demo-kind" data-kind={kind}>
      <KindIcon kind={kind} />
      {KIND_LABEL[kind]}
    </span>
  );
}

export function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="demo-json">
      <span className="demo-json-label">{label}</span>
      <pre>
        <code>{highlightJson(JSON.stringify(value, null, 2) ?? "")}</code>
      </pre>
    </div>
  );
}

// Keys, strings, numbers and literals as Prism-style token spans, so the
// site's code colours apply in every style without shipping Prism to the page.
const JSON_TOKEN =
  /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b|([{}[\],])/g;

export function highlightJson(json: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of json.matchAll(JSON_TOKEN)) {
    const [text, str, colon, num, bool, nul] = match;
    const at = match.index;
    if (at > last) out.push(json.slice(last, at));
    const kind = str
      ? colon
        ? "property"
        : "string"
      : num
        ? "number"
        : bool
          ? "boolean"
          : nul
            ? "keyword"
            : "punctuation";
    out.push(
      <span key={at} className={`token ${kind}`}>
        {str ?? text}
      </span>,
    );
    if (colon)
      out.push(
        <span key={`${at}:`} className="token punctuation">
          {colon}
        </span>,
      );
    last = at + text.length;
  }
  if (last < json.length) out.push(json.slice(last));
  return out;
}

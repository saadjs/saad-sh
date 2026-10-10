import type { ReactNode } from "react";

// Highlighter stroke behind a word. The span isolates so the stroke sits under
// its own text instead of dropping behind the page.
export function Marker({ children }: { children: ReactNode }) {
  return (
    <span className="relative isolate inline-block">
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 24"
        preserveAspectRatio="none"
        className="absolute -bottom-[0.08em] left-[-4%] -z-10 h-[0.34em] w-[108%] overflow-visible"
      >
        <path
          d="M4 14 C40 6, 90 18, 130 10 S180 8, 196 13"
          fill="none"
          stroke="var(--marker)"
          strokeWidth="16"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}

// Page heading with the highlighter under its last word.
export function MarkedTitle({ text, className }: { text: string; className?: string }) {
  const split = text.lastIndexOf(" ");
  return (
    <h1 className={className ?? "page-title"}>
      {split === -1 ? (
        <Marker>{text}</Marker>
      ) : (
        <>
          {text.slice(0, split + 1)}
          <Marker>{text.slice(split + 1)}</Marker>
        </>
      )}
    </h1>
  );
}

const arrows = {
  // Each arrow points at whatever the note is annotating.
  "down-left": {
    viewBox: "0 0 60 30",
    width: 52,
    height: 26,
    paths: ["M56 6 C40 2, 20 8, 6 22", "M5 10 L5 23 L18 20"],
  },
  left: {
    viewBox: "0 0 50 24",
    width: 42,
    height: 20,
    paths: ["M46 16 C34 22, 18 20, 6 10", "M16 6 L5 9 L10 20"],
  },
  down: {
    viewBox: "0 0 30 36",
    width: 22,
    height: 26,
    paths: ["M6 4 C20 6, 24 18, 16 32", "M8 24 L15 33 L24 26"],
  },
} as const;

interface HandNoteProps {
  children: ReactNode;
  arrow?: keyof typeof arrows;
  arrowAfter?: boolean;
  // A rotate utility; kept apart from className so two rotations never compete.
  tilt?: string;
  className?: string;
}

// Blue-pen margin note, optionally with a hand-drawn arrow.
export function HandNote({
  children,
  arrow,
  arrowAfter = false,
  tilt = "-rotate-2",
  className,
}: HandNoteProps) {
  const shape = arrow ? arrows[arrow] : null;
  const svg = shape && (
    <svg
      aria-hidden="true"
      viewBox={shape.viewBox}
      width={shape.width}
      height={shape.height}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {shape.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
  return (
    <span className={`hand inline-flex items-center gap-1.5 ${tilt} ${className ?? ""}`.trim()}>
      {!arrowAfter && svg}
      <span>{children}</span>
      {arrowAfter && svg}
    </span>
  );
}

// Pen circle around the current nav item.
export function PenCircle() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 44"
      preserveAspectRatio="none"
      className="pointer-events-none absolute top-1/2 -left-3.5 h-9 w-[calc(100%+1.75rem)] -translate-y-1/2 overflow-visible text-accent"
    >
      <path
        d="M12 24 C8 8, 44 3, 70 6 C96 9, 99 30, 78 37 C52 44, 10 42, 6 26 C4 16, 20 7, 38 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

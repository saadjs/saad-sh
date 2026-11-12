import { useMemo } from "react";
import rough from "roughjs";
import type { Drawable, Options } from "roughjs/bin/core";

// Hand-drawn shapes for the demo diagrams, in the Excalidraw look the post's
// static illustrations use. rough.js only computes path data here; colours
// and widths come from CSS so every site style can still dress them.

const gen = rough.generator();

/** Stable seed per shape, so a box keeps its wobble across re-renders. */
export function seedFor(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2147483647 || 1;
}

const SHAPE: Options = {
  roughness: 1,
  bowing: 0.9,
  fill: "currentColor",
  fillStyle: "hachure",
  hachureGap: 7.5,
  hachureAngle: -41,
  fillWeight: 1,
};

const SET_CLASS = {
  path: "demo-sketch-line",
  fillPath: "demo-sketch-hachure",
  fillSketch: "demo-sketch-hachure",
} as const;

function Paths({ drawable, lineClass }: { drawable: Drawable; lineClass?: string }) {
  return drawable.sets.map((set, i) => (
    <path
      // rough.js returns a fixed list of sets per shape, so the index is stable.
      // oxlint-disable-next-line no-array-index-key
      key={i}
      d={gen.opsToPath(set, 1)}
      className={set.type === "path" && lineClass ? lineClass : SET_CLASS[set.type]}
    />
  ));
}

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  return [
    `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r}`,
    `V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h}`,
    `H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r}`,
    `V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`,
  ].join(" ");
}

/**
 * A sketched rounded box: a plain fill that hides lines behind it, a hachure
 * tint, and a wobbly outline.
 */
export function SketchBox({
  x,
  y,
  w,
  h,
  r = 8,
  seed,
  hachure = true,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  seed: number;
  hachure?: boolean;
}) {
  const drawable = useMemo(
    () =>
      gen.path(roundedRect(x, y, w, h, r), {
        ...SHAPE,
        seed,
        fill: hachure ? SHAPE.fill : undefined,
      }),
    [x, y, w, h, r, seed, hachure],
  );
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={r} className="demo-sketch-base" />
      <Paths drawable={drawable} />
    </>
  );
}

export function SketchEllipse({
  cx,
  cy,
  rx,
  ry,
  seed,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  seed: number;
}) {
  const drawable = useMemo(
    () => gen.ellipse(cx, cy, rx * 2, ry * 2, { ...SHAPE, seed }),
    [cx, cy, rx, ry, seed],
  );
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className="demo-sketch-base" />
      <Paths drawable={drawable} />
    </>
  );
}

const ARITY: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, Q: 4 };

/** Every point a path passes through or pulls toward, in order. Absolute commands only. */
function pathPoints(d: string): [number, number][] {
  const points: [number, number][] = [];
  let cmd = "M";
  let args: number[] = [];
  let at: [number, number] = [0, 0];
  for (const token of d.match(/[MLHVCQZ]|-?\d*\.?\d+/g) ?? []) {
    if (token in ARITY || token === "Z") {
      cmd = token;
      args = [];
      continue;
    }
    args.push(Number(token));
    if (args.length < ARITY[cmd]) continue;
    if (cmd === "H") at = [args[0], at[1]];
    else if (cmd === "V") at = [at[0], args[0]];
    else {
      for (let i = 0; i < args.length - 2; i += 2) points.push([args[i], args[i + 1]]);
      at = [args[args.length - 2], args[args.length - 1]];
    }
    points.push(at);
    args = [];
  }
  return points;
}

function arrowHead([tx, ty]: [number, number], [fx, fy]: [number, number], seed: number) {
  const angle = Math.atan2(ty - fy, tx - fx);
  const spread = 0.5;
  const length = 9;
  return [-1, 1].map((sign) =>
    gen.line(
      tx,
      ty,
      tx - length * Math.cos(angle + sign * spread),
      ty - length * Math.sin(angle + sign * spread),
      { roughness: 0.6, seed: seed + sign + 2 },
    ),
  );
}

/** A sketched connector with open arrowheads drawn as strokes, not markers. */
export function SketchEdge({
  d,
  seed,
  both,
  ...data
}: {
  d: string;
  seed: number;
  /** Arrowheads at both ends. */
  both?: boolean;
  "data-taken"?: string;
  "data-back"?: string;
}) {
  const drawn = useMemo(() => {
    const points = pathPoints(d);
    const n = points.length;
    const heads = n < 2 ? [] : arrowHead(points[n - 1], points[n - 2], seed);
    if (both && n > 1) heads.push(...arrowHead(points[0], points[1], seed + 7));
    return {
      line: gen.path(d, { roughness: 0.8, bowing: 1, seed, disableMultiStroke: true }),
      heads,
    };
  }, [d, seed, both]);
  return (
    <g className="demo-sketch-edge" {...data}>
      <Paths drawable={drawn.line} lineClass="demo-flow-edge" />
      {drawn.heads.map((head, i) => (
        // Two or four heads in a fixed order.
        // oxlint-disable-next-line no-array-index-key
        <Paths key={i} drawable={head} lineClass="demo-flow-arrowhead" />
      ))}
    </g>
  );
}

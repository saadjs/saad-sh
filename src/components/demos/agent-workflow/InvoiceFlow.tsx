import { useEffect, useRef } from "react";
import { KIND_LABEL, stepById, type StepId, type StepKind } from "./model";
import { KindIcon } from "./shared";
import { SketchBox, SketchEdge, seedFor } from "./sketch";

/** The kind line: icon then label, centred together. Labels are 11px monospace. */
const ICON = 12;
const ICON_GAP = 4;
const kindLineStart = (cx: number, label: string) =>
  cx - (ICON + ICON_GAP + label.length * 6.6) / 2;

// The invoice pipeline drawn as a graph. Two layouts are rendered and CSS shows
// one: a wide one for desktop and a tall one so labels stay readable on phones.

export type NodeState = "idle" | "done" | "active" | "skipped";

export interface FlowView {
  nodes?: Partial<Record<StepId, NodeState>>;
  /** Edges drawn as taken, as "from>to" keys. */
  taken?: Set<string>;
  badges?: Partial<Record<StepId, string>>;
  kinds?: Partial<Record<StepId, StepKind>>;
  /** Animate the invoice moving along this edge. Change `id` to replay. */
  move?: { from: StepId; to: StepId; id: number };
  onSelect?: (step: StepId) => void;
  selected?: StepId;
}

interface Layout {
  name: "wide" | "tall";
  viewBox: string;
  w: number;
  h: number;
  /**
   * Extra hit area above and below each box, in viewBox units. The SVG scales
   * down on small screens, so the box alone drops under 44px; this keeps the
   * button tall enough at the narrowest width each layout is shown at.
   */
  hitPad: number;
  pos: Record<StepId, { x: number; y: number }>;
  edges: { from: StepId; to: StepId; d: string }[];
  labels: { x: number; y: number; text: string; anchor?: "start" | "end" | "middle" }[];
}

function hEdge(a: { x: number; y: number }, b: { x: number; y: number }, w: number, h: number) {
  return `M ${a.x + w} ${a.y + h / 2} L ${b.x - 3} ${b.y + h / 2}`;
}

function vEdge(a: { x: number; y: number }, b: { x: number; y: number }, w: number, h: number) {
  return `M ${a.x + w / 2} ${a.y + h} L ${b.x + w / 2} ${b.y - 3}`;
}

const widePos: Layout["pos"] = {
  receive: { x: 4, y: 40 },
  extract: { x: 120, y: 40 },
  validate: { x: 236, y: 40 },
  route: { x: 352, y: 40 },
  post: { x: 468, y: 40 },
  notify: { x: 584, y: 40 },
  investigate: { x: 352, y: 172 },
  approve: { x: 468, y: 172 },
};

const WIDE: Layout = {
  name: "wide",
  viewBox: "0 0 688 262",
  w: 100,
  h: 48,
  hitPad: 8,
  pos: widePos,
  edges: [
    { from: "receive", to: "extract", d: hEdge(widePos.receive, widePos.extract, 100, 48) },
    { from: "extract", to: "validate", d: hEdge(widePos.extract, widePos.validate, 100, 48) },
    { from: "validate", to: "route", d: hEdge(widePos.validate, widePos.route, 100, 48) },
    { from: "route", to: "post", d: hEdge(widePos.route, widePos.post, 100, 48) },
    { from: "post", to: "notify", d: hEdge(widePos.post, widePos.notify, 100, 48) },
    { from: "route", to: "investigate", d: vEdge(widePos.route, widePos.investigate, 100, 48) },
    { from: "investigate", to: "approve", d: hEdge(widePos.investigate, widePos.approve, 100, 48) },
    { from: "route", to: "approve", d: "M 436 88 L 484 169" },
    { from: "approve", to: "post", d: "M 534 172 L 534 91" },
  ],
  labels: [
    { x: 392, y: 134, text: "exception", anchor: "end" },
    { x: 466, y: 128, text: "over limit", anchor: "start" },
  ],
};

const tallPos: Layout["pos"] = {
  receive: { x: 16, y: 28 },
  extract: { x: 16, y: 100 },
  validate: { x: 16, y: 172 },
  route: { x: 16, y: 244 },
  post: { x: 16, y: 388 },
  notify: { x: 16, y: 460 },
  investigate: { x: 196, y: 316 },
  approve: { x: 196, y: 388 },
};

const TALL: Layout = {
  name: "tall",
  viewBox: "0 0 360 520",
  w: 130,
  h: 44,
  hitPad: 11,
  pos: tallPos,
  edges: [
    { from: "receive", to: "extract", d: vEdge(tallPos.receive, tallPos.extract, 130, 44) },
    { from: "extract", to: "validate", d: vEdge(tallPos.extract, tallPos.validate, 130, 44) },
    { from: "validate", to: "route", d: vEdge(tallPos.validate, tallPos.route, 130, 44) },
    { from: "route", to: "post", d: vEdge(tallPos.route, tallPos.post, 130, 44) },
    { from: "post", to: "notify", d: vEdge(tallPos.post, tallPos.notify, 130, 44) },
    { from: "route", to: "investigate", d: "M 146 260 H 261 V 313" },
    { from: "investigate", to: "approve", d: vEdge(tallPos.investigate, tallPos.approve, 130, 44) },
    { from: "route", to: "approve", d: "M 146 274 H 346 V 410 H 329" },
    { from: "approve", to: "post", d: "M 196 410 L 149 410" },
  ],
  labels: [
    { x: 254, y: 292, text: "exception", anchor: "end" },
    { x: 342, y: 300, text: "over limit", anchor: "end" },
  ],
};

function Packet({ d, id }: { d: string; id: number }) {
  const motion = useRef<SVGAnimateMotionElement>(null);
  const fade = useRef<SVGAnimateElement>(null);

  useEffect(() => {
    // Animations added after page load start at the document's time zero, so
    // begin them by hand each time the move changes. With reduced motion the
    // packet stays invisible and the highlighted box shows where it is.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    motion.current?.beginElement();
    fade.current?.beginElement();
  }, [d, id]);

  return (
    <circle r={7} className="demo-flow-packet" opacity={0}>
      <animateMotion ref={motion} dur="0.7s" begin="indefinite" fill="freeze" path={d} />
      <animate
        ref={fade}
        attributeName="opacity"
        values="1;1;0"
        keyTimes="0;0.85;1"
        dur="0.8s"
        begin="indefinite"
        fill="freeze"
      />
    </circle>
  );
}

/** One line per item, placed where it can't collide with a neighbour's badge. */
function Badge({ layout, x, y, text }: { layout: Layout; x: number; y: number; text: string }) {
  const lines = text.split(", ");
  const { w, h } = layout;
  // Wide: under the box. Tall main column: to its right, or under it when a
  // branch box shares the row. Tall branch: above.
  const place =
    layout.name === "wide"
      ? { x: x + w / 2, y: y + h + 14, anchor: "middle" as const }
      : x < 100 && Object.values(layout.pos).some((p) => p.y === y && p.x > x)
        ? { x: x + w / 2, y: y + h + 13, anchor: "middle" as const }
        : x < 100
          ? { x: x + w + 8, y: y + h / 2 - (lines.length - 1) * 6.5 + 4, anchor: "start" as const }
          : { x: x + w, y: y - 7 - (lines.length - 1) * 13, anchor: "end" as const };
  return (
    <text x={place.x} y={place.y} textAnchor={place.anchor} className="demo-flow-badge">
      {lines.map((line, i) => (
        <tspan key={line} x={place.x} dy={i ? 13 : 0}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function FlowSvg({ layout, view }: { layout: Layout; view: FlowView }) {
  const { w, h } = layout;
  const moveEdge = view.move
    ? layout.edges.find((e) => e.from === view.move!.from && e.to === view.move!.to)
    : undefined;

  return (
    <svg className={`demo-flow demo-flow-${layout.name}`} viewBox={layout.viewBox}>
      {layout.edges.map((edge) => {
        const key = `${edge.from}>${edge.to}`;
        return (
          <SketchEdge
            key={key}
            d={edge.d}
            seed={seedFor(layout.name + key)}
            data-taken={view.taken?.has(key) ? "" : undefined}
          />
        );
      })}

      {layout.labels.map((label) => (
        <text
          key={label.text}
          x={label.x}
          y={label.y}
          textAnchor={label.anchor ?? "middle"}
          className="demo-flow-edge-label"
        >
          {label.text}
        </text>
      ))}

      {(Object.keys(layout.pos) as StepId[]).map((id) => {
        const { x, y } = layout.pos[id];
        const kind = view.kinds?.[id] ?? stepById[id].kind;
        const state = view.nodes?.[id] ?? "idle";
        const badge = view.badges?.[id];
        return (
          <g
            key={id}
            className="demo-flow-node"
            data-kind={kind}
            data-state={state}
            data-selected={view.selected === id ? "" : undefined}
          >
            <SketchBox x={x} y={y} w={w} h={h} r={7} seed={seedFor(layout.name + id)} />
            <text
              x={x + w / 2}
              y={y + h / 2 - 7}
              textAnchor="middle"
              dominantBaseline="central"
              className="demo-flow-name"
            >
              {stepById[id].name}
            </text>
            <KindIcon
              kind={kind}
              x={kindLineStart(x + w / 2, KIND_LABEL[kind])}
              y={y + h / 2 + 10 - ICON / 2}
              size={ICON}
            />
            <text
              x={kindLineStart(x + w / 2, KIND_LABEL[kind]) + ICON + ICON_GAP}
              y={y + h / 2 + 10}
              dominantBaseline="central"
              className="demo-flow-kind"
            >
              {KIND_LABEL[kind]}
            </text>
            {badge ? <Badge layout={layout} x={x} y={y} text={badge} /> : null}
            {view.onSelect ? (
              <foreignObject x={x} y={y - layout.hitPad} width={w} height={h + 2 * layout.hitPad}>
                <button
                  type="button"
                  className="demo-flow-hit"
                  style={{ paddingBlock: layout.hitPad }}
                  aria-label={`${stepById[id].name} (${KIND_LABEL[kind]})`}
                  aria-pressed={view.selected === id}
                  onClick={() => view.onSelect?.(id)}
                >
                  <span className="demo-flow-hit-ring" />
                </button>
              </foreignObject>
            ) : null}
          </g>
        );
      })}

      {moveEdge && view.move ? <Packet d={moveEdge.d} id={view.move.id} /> : null}
    </svg>
  );
}

export function InvoiceFlow(view: FlowView) {
  return (
    <div className="demo-flow-wrap">
      <FlowSvg layout={WIDE} view={view} />
      <FlowSvg layout={TALL} view={view} />
    </div>
  );
}

/** Every edge, as "from>to", in the order a run can take them. */
export const FLOW_EDGES = WIDE.edges.map((edge) => `${edge.from}>${edge.to}`);

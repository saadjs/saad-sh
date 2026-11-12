import { useState } from "react";
import type { StepKind } from "./model";
import { DemoFrame, KindIcon, KindTag } from "./shared";
import { SketchBox, SketchEdge, seedFor } from "./sketch";

type NodeKind = StepKind | "io";

interface FlowNode {
  id: string;
  label: string;
  kind: NodeKind;
  x: number;
  y: number;
}

interface FlowEdge {
  from: string;
  to: string;
  /** Draw as a return arc under the nodes, for loops. */
  back?: boolean;
  /** Draw the return arc over the nodes instead of under them. */
  above?: boolean;
  label?: string;
}

interface Pattern {
  name: string;
  what: string;
  when: string;
  invoice: string;
  cloudflare: string;
  aws: string;
  pi: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const W = 96;
const H = 40;

const PATTERNS: Pattern[] = [
  {
    name: "Prompt chaining",
    what: "Each LLM call works on the previous call's output, with code gates in between that stop the run if a check fails.",
    when: "The task splits cleanly into fixed steps.",
    invoice: "Extract, then a code gate checks the sums, then a model writes the summary.",
    cloudflare: "Sequential step.do calls; the gate is code between them.",
    aws: "Task states in sequence, each one a bedrock:invokeModel call.",
    pi: "Task phases in sequence, each one checkpointed; the gate is code between phases.",
    nodes: [
      { id: "in", label: "PDF", kind: "io", x: 0, y: 100 },
      { id: "a", label: "extract", kind: "model", x: 116, y: 100 },
      { id: "g", label: "gate", kind: "code", x: 232, y: 100 },
      { id: "b", label: "summarize", kind: "model", x: 348, y: 100 },
    ],
    edges: [
      { from: "in", to: "a" },
      { from: "a", to: "g" },
      { from: "g", to: "b" },
    ],
  },
  {
    name: "Routing",
    what: "Classify the input, then send it down a path built for that kind of input.",
    when: "Inputs fall into distinct groups that are better handled apart.",
    invoice: "Sort an inbox into invoices, credit notes and disputes before anything else runs.",
    cloudflare: "An if or switch on a value a previous step returned.",
    aws: "A Choice state on the classifier's output.",
    pi: "Code in a phase picks the next phase from the classifier's output.",
    nodes: [
      { id: "in", label: "email", kind: "io", x: 0, y: 100 },
      { id: "c", label: "classify", kind: "model", x: 130, y: 100 },
      { id: "a", label: "invoice", kind: "code", x: 300, y: 20 },
      { id: "b", label: "credit note", kind: "code", x: 300, y: 100 },
      { id: "d", label: "dispute", kind: "human", x: 300, y: 180 },
    ],
    edges: [
      { from: "in", to: "c" },
      { from: "c", to: "a" },
      { from: "c", to: "b" },
      { from: "c", to: "d" },
    ],
  },
  {
    name: "Parallelization",
    what: "Run independent checks at once and join the results in code. Or run the same check several times and vote.",
    when: "Subtasks do not depend on each other, or one answer is not trusted enough on its own.",
    invoice: "Vendor, PO and fraud checks run side by side; code joins them into one verdict.",
    cloudflare: "Promise.all over step.do calls with fixed names.",
    aws: "A Parallel state, or a Map state over a list.",
    pi: "Child tasks the parent waits on with policy allSettled.",
    nodes: [
      { id: "in", label: "invoice", kind: "io", x: 0, y: 100 },
      { id: "a", label: "vendor", kind: "code", x: 150, y: 20 },
      { id: "b", label: "PO", kind: "code", x: 150, y: 100 },
      { id: "c", label: "fraud", kind: "model", x: 150, y: 180 },
      { id: "j", label: "join", kind: "code", x: 340, y: 100 },
    ],
    edges: [
      { from: "in", to: "a" },
      { from: "in", to: "b" },
      { from: "in", to: "c" },
      { from: "a", to: "j" },
      { from: "b", to: "j" },
      { from: "c", to: "j" },
    ],
  },
  {
    name: "Orchestrator-workers",
    what: "A model plans the subtasks at run time, workers do them, and the results are combined.",
    when: "The subtasks cannot be known ahead of time.",
    invoice:
      "A 40-page statement: the planner lists which pages hold invoices, a worker extracts each one.",
    cloudflare: "One step returns the plan; then one step.do per item, named by its index.",
    aws: "A Task that returns the plan, then a Map state over it.",
    pi: "A phase creates one child task per planned item, then waits on all of them.",
    nodes: [
      { id: "in", label: "statement", kind: "io", x: 0, y: 100 },
      { id: "o", label: "plan", kind: "model", x: 120, y: 100 },
      { id: "a", label: "worker 1", kind: "model", x: 240, y: 20 },
      { id: "b", label: "worker 2", kind: "model", x: 240, y: 100 },
      { id: "c", label: "worker n", kind: "model", x: 240, y: 180 },
      { id: "s", label: "combine", kind: "code", x: 360, y: 100 },
    ],
    edges: [
      { from: "in", to: "o" },
      { from: "o", to: "a" },
      { from: "o", to: "b" },
      { from: "o", to: "c" },
      { from: "a", to: "s" },
      { from: "b", to: "s" },
      { from: "c", to: "s" },
    ],
  },
  {
    name: "Evaluator-optimizer",
    what: "One call drafts, another grades it against clear criteria, and the loop repeats a fixed number of times at most.",
    when: "What good looks like can be stated, and another pass actually improves it.",
    invoice:
      "Draft the dispute email to the vendor; a grader checks tone and that every number matches the record.",
    cloudflare: "A for loop with a cap; step names include the attempt number.",
    aws: "A Choice state that loops back, with a counter in the state.",
    pi: "An onYield hook whose review sends the agent back with continue, under a turn limit.",
    nodes: [
      { id: "in", label: "dispute", kind: "io", x: 0, y: 80 },
      { id: "g", label: "draft", kind: "model", x: 130, y: 80 },
      { id: "e", label: "grade", kind: "model", x: 260, y: 80 },
      { id: "out", label: "send", kind: "human", x: 384, y: 80 },
    ],
    edges: [
      { from: "in", to: "g" },
      { from: "g", to: "e" },
      { from: "e", to: "g", back: true, label: "feedback, max 3" },
      { from: "e", to: "out" },
    ],
  },
  {
    name: "Agent",
    what: "The model picks the next tool call from what the last one returned, in a loop, until it decides it is done or hits a limit.",
    when: "Open-ended problems where the number of steps cannot be predicted.",
    invoice:
      "Only inside the Investigate step: read-only tools, a turn limit, and its output is a note for a person.",
    cloudflare:
      "An Agent (a Durable Object) or one bounded step; long or approval-gated work goes to a Workflow.",
    aws: "An agent runtime such as Bedrock AgentCore, called from a Task state.",
    pi: "A conversation: every model turn and tool call is already a saved task, and beforeTool hooks gate risky tools.",
    nodes: [
      { id: "in", label: "exception", kind: "io", x: 0, y: 80 },
      { id: "a", label: "agent", kind: "agent", x: 150, y: 80 },
      { id: "t", label: "tools", kind: "code", x: 300, y: 80 },
      { id: "out", label: "note", kind: "human", x: 150, y: 190 },
    ],
    edges: [
      { from: "in", to: "a" },
      { from: "a", to: "t" },
      { from: "t", to: "a", back: true, above: true, label: "results, max 8 turns" },
      { from: "a", to: "out" },
    ],
  },
];

function edgePath(from: FlowNode, to: FlowNode, back?: boolean, above?: boolean): string {
  if (back && above) {
    const x1 = from.x + W / 2;
    const x2 = to.x + W / 2;
    return `M ${x1} ${from.y} C ${x1} ${from.y - 50}, ${x2} ${from.y - 50}, ${x2} ${to.y - 4}`;
  }
  if (back) {
    const x1 = from.x + W / 2;
    const x2 = to.x + W / 2;
    const y = from.y + H;
    return `M ${x1} ${y} C ${x1} ${y + 50}, ${x2} ${y + 50}, ${x2} ${y + 4}`;
  }
  if (to.y > from.y + H && Math.abs(to.x - from.x) < W) {
    return `M ${from.x + W / 2} ${from.y + H} L ${to.x + W / 2} ${to.y - 4}`;
  }
  const x1 = from.x + W;
  const y1 = from.y + H / 2;
  const x2 = to.x - 4;
  const y2 = to.y + H / 2;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

function Flow({ pattern }: { pattern: Pattern }) {
  const byId = Object.fromEntries(pattern.nodes.map((node) => [node.id, node]));
  return (
    <svg className="demo-flow" viewBox="-4 0 456 240" aria-hidden="true">
      {pattern.edges.map((edge) => {
        const from = byId[edge.from];
        const to = byId[edge.to];
        const d = edgePath(from, to, edge.back, edge.above);
        return (
          <g key={`${edge.from}-${edge.to}`}>
            <SketchEdge
              d={d}
              seed={seedFor(`${pattern.name}${edge.from}>${edge.to}`)}
              data-back={edge.back ? "" : undefined}
            />
            {edge.label ? (
              <text
                x={(from.x + to.x) / 2 + W / 2}
                y={edge.above ? from.y - 46 : from.y + H + 58}
                textAnchor="middle"
                className="demo-flow-edge-label"
              >
                {edge.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {pattern.nodes.map((node) => (
        <g key={node.id} className="demo-flow-node" data-kind={node.kind}>
          <SketchBox
            x={node.x}
            y={node.y}
            w={W}
            h={H}
            r={6}
            seed={seedFor(pattern.name + node.id)}
            hachure={node.kind !== "io"}
          />
          {/* Icon above the label; inputs and outputs have no kind, so no icon. */}
          {node.kind === "io" ? null : (
            <KindIcon kind={node.kind} x={node.x + W / 2 - 7} y={node.y + 5} size={14} />
          )}
          <text
            x={node.x + W / 2}
            y={node.kind === "io" ? node.y + H / 2 : node.y + 28}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function PatternsDemo() {
  const [active, setActive] = useState(0);
  const pattern = PATTERNS[active];

  return (
    <DemoFrame
      title="Six patterns, one invoice system"
      intro="Pick a pattern to see its shape, where it fits the invoice job, and the primitive that runs it on Cloudflare, AWS and pi-durable."
    >
      <fieldset className="demo-tabs">
        <legend className="sr-only">Patterns</legend>
        {PATTERNS.map((p, i) => (
          <button
            key={p.name}
            type="button"
            className="demo-tab"
            aria-pressed={i === active}
            onClick={() => setActive(i)}
          >
            {p.name}
          </button>
        ))}
      </fieldset>
      <div className="demo-pattern" aria-live="polite">
        <Flow pattern={pattern} />
        <div className="demo-legend" aria-hidden="true">
          <span>
            <KindTag kind="code" /> plain code
          </span>
          <span>
            <KindTag kind="model" /> LLM call
          </span>
          <span>
            <KindTag kind="agent" /> LLM loop
          </span>
          <span>
            <KindTag kind="human" /> person
          </span>
        </div>
        <dl className="demo-pros">
          <div>
            <dt>What</dt>
            <dd>{pattern.what}</dd>
          </div>
          <div>
            <dt>Use when</dt>
            <dd>{pattern.when}</dd>
          </div>
          <div>
            <dt>In the invoice system</dt>
            <dd>{pattern.invoice}</dd>
          </div>
          <div>
            <dt>Cloudflare Workflows</dt>
            <dd>{pattern.cloudflare}</dd>
          </div>
          <div>
            <dt>AWS Step Functions</dt>
            <dd>{pattern.aws}</dd>
          </div>
          <div>
            <dt>pi-durable</dt>
            <dd>{pattern.pi}</dd>
          </div>
        </dl>
      </div>
    </DemoFrame>
  );
}

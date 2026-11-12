import { useId, useState } from "react";
import { InvoiceFlow } from "./InvoiceFlow";
import { DIAL_LEVELS, SCORE_LABELS } from "./model";
import { DemoFrame, KindIcon } from "./shared";
import { SketchBox, SketchEdge, SketchEllipse, seedFor } from "./sketch";

/** Room for an icon and a tool name at 12px monospace. */
const toolWidth = (tool: string) => Math.max(96, tool.length * 7.4 + 34);

/** One agent in the middle, its tools around it. Write tools behind a gate get a person in between. */
function AgentHub({ tools, gated }: { tools: string[]; gated: string[] }) {
  const cx = 200;
  const cy = 150;
  const r = 118;
  return (
    <svg className="demo-flow demo-hub" viewBox="0 0 400 300" aria-hidden="true">
      {tools.map((tool, i) => {
        const angle = (i / tools.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const gate = gated.includes(tool);
        const gx = cx + Math.cos(angle) * (r * 0.7);
        const gy = cy + Math.sin(angle) * (r * 0.7);
        return (
          <g key={tool}>
            <SketchEdge
              d={`M ${cx + Math.cos(angle) * 66} ${cy + Math.sin(angle) * 38} L ${x - Math.cos(angle) * 18} ${y - Math.sin(angle) * 18}`}
              seed={seedFor(`edge${tool}`)}
              both
              data-taken=""
            />
            {gate ? (
              <g className="demo-flow-node" data-kind="human">
                <SketchBox
                  x={gx - 36}
                  y={gy - 12}
                  w={72}
                  h={24}
                  r={6}
                  seed={seedFor(`gate${tool}`)}
                />
                <KindIcon kind="human" x={gx - 29} y={gy - 6} size={12} />
                <text
                  x={gx + 8}
                  y={gy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="demo-flow-kind"
                >
                  approve
                </text>
              </g>
            ) : null}
            <g className="demo-flow-node" data-kind="code">
              <SketchBox
                x={x - toolWidth(tool) / 2}
                y={y - 14}
                w={toolWidth(tool)}
                h={28}
                r={6}
                seed={seedFor(tool)}
              />
              <KindIcon kind="code" x={x - (16 + tool.length * 7.4) / 2} y={y - 6} size={12} />
              <text
                x={x + 8}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="demo-flow-kind"
              >
                {tool}
              </text>
            </g>
          </g>
        );
      })}
      <g className="demo-flow-node" data-kind="agent" data-state="active">
        <SketchEllipse cx={cx} cy={cy} rx={64} ry={34} seed={seedFor("agent")} />
        <KindIcon kind="agent" x={cx - 30} y={cy - 14} size={16} />
        <text
          x={cx + 10}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="central"
          className="demo-flow-name"
        >
          agent
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          dominantBaseline="central"
          className="demo-flow-kind"
        >
          picks next tool
        </text>
      </g>
    </svg>
  );
}

export default function DialDemo() {
  const [level, setLevel] = useState(3);
  const current = DIAL_LEVELS[level];
  const sliderId = useId();

  return (
    <DemoFrame
      title="From all code to full agent"
      intro="Slide from all code to an autonomous agent. Same invoice job at every stop."
    >
      <div className="demo-dial">
        <label htmlFor={sliderId} className="demo-dial-label">
          Level {level}: <strong>{current.name}</strong>
        </label>
        <input
          id={sliderId}
          className="demo-range"
          type="range"
          min={0}
          max={DIAL_LEVELS.length - 1}
          step={1}
          value={level}
          aria-valuetext={current.name}
          onChange={(event) => setLevel(Number(event.target.value))}
        />
        <div className="demo-dial-ends" aria-hidden="true">
          <span>more code</span>
          <span>more agent</span>
        </div>
      </div>

      {current.agentTools ? (
        <AgentHub tools={current.agentTools} gated={current.gatedTools ?? []} />
      ) : (
        <InvoiceFlow kinds={current.kinds} />
      )}

      <p className="demo-detail-summary">{current.summary}</p>

      <dl className="demo-meters">
        {SCORE_LABELS.map(({ key, label }) => (
          <div key={key} className="demo-meter">
            <dt>{label}</dt>
            <dd>
              <span className="demo-meter-track" aria-hidden="true">
                <span
                  className="demo-meter-fill"
                  style={{ width: `${(current.scores[key] / 5) * 100}%` }}
                />
              </span>
              <span className="demo-meter-value">{current.scores[key]} / 5</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="demo-footnote">
        Breaks when: {current.breaksWhen} Scores are rough judgment calls, not benchmarks.
      </p>
    </DemoFrame>
  );
}

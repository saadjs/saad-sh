import { useEffect, useState } from "react";
import { InvoiceFlow, type NodeState } from "./InvoiceFlow";
import { HAPPY_PATH, stepById, type StepId } from "./model";
import { DemoFrame, JsonBlock, KindTag } from "./shared";

const RUN = HAPPY_PATH.filter((stage) => !stage.skipped).map((stage) => stage.step);
type Move = { from: StepId; to: StepId; id: number };
const stageOf = (step: StepId) => HAPPY_PATH.find((stage) => stage.step === step)!;

export default function PipelineDemo() {
  const [{ index, move }, setRun] = useState<{ index: number; move?: Move }>({ index: 0 });
  const [selected, setSelected] = useState<StepId>(RUN[0]);
  const [playing, setPlaying] = useState(false);
  const last = RUN.length - 1;
  const isPlaying = playing && index < last;

  const go = (next: number) => {
    setRun({
      index: next,
      move: next === index + 1 ? { from: RUN[index], to: RUN[next], id: next } : undefined,
    });
    setSelected(RUN[next]);
    // A manual move pauses. Without this, `playing` stays true after a run
    // finishes and Back or Start over would quietly resume playback.
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing || index >= last) return;
    const timer = window.setTimeout(() => {
      setRun({ index: index + 1, move: { from: RUN[index], to: RUN[index + 1], id: index + 1 } });
      setSelected(RUN[index + 1]);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [playing, index, last]);

  const nodes: Partial<Record<StepId, NodeState>> = {};
  for (const stage of HAPPY_PATH) {
    const at = RUN.indexOf(stage.step);
    nodes[stage.step] = stage.skipped
      ? "skipped"
      : at < index
        ? "done"
        : at === index
          ? "active"
          : "idle";
  }
  const taken = new Set(
    RUN.slice(0, index + 1).flatMap((step, i) => (i ? [`${RUN[i - 1]}>${step}`] : [])),
  );

  const stage = stageOf(selected);
  const step = stepById[selected];

  return (
    <DemoFrame
      title="One invoice, step by step"
      intro="Press Next or Play to move the invoice along. Click any box to see what it does."
    >
      <InvoiceFlow
        nodes={nodes}
        taken={taken}
        move={move}
        selected={selected}
        onSelect={setSelected}
      />

      <div className="demo-controls">
        <button
          type="button"
          className="ui-btn"
          disabled={index === 0}
          onClick={() => go(index - 1)}
        >
          Back
        </button>
        <button
          type="button"
          className="ui-btn ui-btn-primary"
          onClick={() => (index === RUN.length - 1 ? go(0) : go(index + 1))}
        >
          {index === RUN.length - 1 ? "Start over" : "Next"}
        </button>
        <button
          type="button"
          className="ui-btn"
          aria-pressed={isPlaying}
          onClick={() => {
            if (isPlaying) return setPlaying(false);
            if (index === last) go(0);
            setPlaying(true);
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      <div className="demo-detail" aria-live="polite">
        <p className="demo-detail-title">
          {step.name} <KindTag kind={step.kind} />
          {stage.skipped ? <span className="demo-badge">skipped this run</span> : null}
        </p>
        <p>{stage.note}</p>
        {stage.output !== undefined ? (
          <div className="demo-io">
            <JsonBlock label="in" value={stage.input} />
            <JsonBlock label="out" value={stage.output} />
          </div>
        ) : null}
      </div>
    </DemoFrame>
  );
}

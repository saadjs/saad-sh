import { useEffect, useMemo, useState } from "react";
import { InvoiceFlow, type NodeState } from "./InvoiceFlow";
import {
  clock,
  NO_FAILURES,
  SCENARIO_LABELS,
  simulate,
  stepById,
  STEPS,
  type Scenario,
  type StepId,
  type TraceEvent,
} from "./model";
import { DemoFrame, KindTag } from "./shared";

/** The diagram's state after the first `upTo + 1` events of a trace. */
function viewAt(trace: TraceEvent[], upTo: number) {
  // Labels accumulate per step so a replay or a crash adds to the story
  // instead of erasing it: Validate should still read "flagged" after the
  // worker restarts. Only "waiting" is transient, since it gets resolved.
  const labels: Partial<Record<StepId, string[]>> = {};
  const addLabel = (step: StepId, label: string) => {
    const list = (labels[step] ?? []).filter((l) => l !== "waiting" && l !== label);
    labels[step] = [...list, label];
  };
  const retries: Partial<Record<StepId, number>> = {};
  const path: StepId[] = [];
  let last: StepId = "receive";

  for (const event of trace.slice(0, upTo + 1)) {
    if (event.step === "runtime") {
      addLabel(last, "worker lost");
      continue;
    }
    const step = event.step;
    last = step;
    if (event.status !== "replayed" && path.at(-1) !== step) path.push(step);
    if (event.status === "retry") retries[step] = (retries[step] ?? 0) + 1;
    const label = {
      ok: step === "approve" ? "approved" : undefined,
      retry: undefined,
      failed: "rejected",
      replayed: "replayed",
      waiting: "waiting",
      fallback: "template",
      flagged: "flagged",
      crash: undefined,
    }[event.status];
    if (label) addLabel(step, label);
  }

  const badges: Partial<Record<StepId, string>> = {};
  for (const { id } of STEPS) {
    const n = retries[id];
    const parts = [n ? `${n} ${n > 1 ? "retries" : "retry"}` : undefined, ...(labels[id] ?? [])];
    const text = parts.filter(Boolean).join(", ");
    if (text) badges[id] = text;
  }

  const visitedEver = new Set(trace.flatMap((e) => (e.step === "runtime" ? [] : [e.step])));
  const visitedNow = new Set(path);
  const nodes: Partial<Record<StepId, NodeState>> = {};
  for (const { id } of STEPS) {
    nodes[id] = !visitedEver.has(id)
      ? "skipped"
      : id === last
        ? "active"
        : visitedNow.has(id)
          ? "done"
          : "idle";
  }
  const taken = new Set(path.slice(1).map((step, i) => `${path[i]}>${step}`));
  return { nodes, badges, taken, path };
}

export default function FailureDemo() {
  const [scenario, setScenario] = useState<Scenario>(NO_FAILURES);
  const { trace, outcome } = useMemo(() => simulate(scenario), [scenario]);
  const end = trace.length - 1;
  // null means "the end of the run", so a new scenario needs no second simulate.
  const [cursor, setCursor] = useState<number | null>(null);
  const pos = cursor ?? end;
  const [playing, setPlaying] = useState(false);

  const isPlaying = playing && pos < end;

  useEffect(() => {
    if (!playing || pos >= end) return;
    const timer = window.setTimeout(() => setCursor(pos + 1), 1000);
    return () => window.clearTimeout(timer);
  }, [playing, pos, end]);

  // A new scenario shows its finished run; Play replays it.
  const toggle = (key: keyof Scenario, on: boolean) => {
    setScenario({ ...scenario, [key]: on });
    setCursor(null);
    setPlaying(false);
  };

  const view = viewAt(trace, pos);
  const prev = pos > 0 ? viewAt(trace, pos - 1).path : [];
  const from = prev.at(-1);
  const to = view.path.at(-1);
  const move = playing && from && to && from !== to ? { from, to, id: pos } : undefined;
  const event = trace[pos];

  return (
    <DemoFrame
      title="Failures, one at a time"
      intro="Switch on failures, then press Play to watch the run handle them."
    >
      <fieldset className="demo-toggles">
        <legend className="sr-only">Failures to inject</legend>
        {SCENARIO_LABELS.map(({ key, label, hint }) => (
          <label key={key} className="demo-toggle">
            <input
              type="checkbox"
              checked={scenario[key]}
              onChange={(e) => toggle(key, e.target.checked)}
            />
            {label}
            <span className="demo-toggle-hint">{hint}</span>
          </label>
        ))}
      </fieldset>

      <InvoiceFlow nodes={view.nodes} badges={view.badges} taken={view.taken} move={move} />

      <div className="demo-event" data-status={event.status} aria-live="polite">
        <span className="demo-trace-time">{clock(event.at)}</span>
        <span className="demo-trace-step">
          {event.step === "runtime" ? "runtime" : stepById[event.step].name}
          {event.step === "runtime" ? null : <KindTag kind={stepById[event.step].kind} />}
        </span>
        <span className="demo-trace-text">{event.text}</span>
      </div>

      <div className="demo-controls">
        <button
          type="button"
          className="ui-btn ui-btn-primary"
          onClick={() => {
            if (isPlaying) return setPlaying(false);
            if (pos >= end) setCursor(0);
            setPlaying(true);
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="ui-btn"
          disabled={pos === 0}
          onClick={() => {
            setPlaying(false);
            setCursor(pos - 1);
          }}
        >
          Back
        </button>
        <button
          type="button"
          className="ui-btn"
          disabled={pos === end}
          onClick={() => {
            setPlaying(false);
            setCursor(pos + 1);
          }}
        >
          Next
        </button>
        <span className="demo-progress">
          event {pos + 1} / {trace.length}
        </span>
      </div>

      <dl className="demo-stats">
        <div>
          <dt>Result</dt>
          <dd>{outcome.result === "posted" ? "posted once" : "rejected"}</dd>
        </div>
        <div>
          <dt>LLM calls</dt>
          <dd>{outcome.modelCalls}</dd>
        </div>
        <div>
          <dt>Retries</dt>
          <dd>{outcome.retries}</dd>
        </div>
        <div>
          <dt>People asked</dt>
          <dd>{outcome.humanTouches}</dd>
        </div>
        <div>
          <dt>Wall time</dt>
          <dd>{clock(outcome.elapsed).slice(1)}</dd>
        </div>
      </dl>
    </DemoFrame>
  );
}

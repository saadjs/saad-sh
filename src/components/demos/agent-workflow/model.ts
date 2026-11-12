// The invoice pipeline that every demo in the "deterministic systems with agents"
// post walks through. It is a pure simulation: no clocks, no randomness, so the
// server render and the hydrated client always agree.

export type StepKind = "code" | "model" | "agent" | "human";

export type StepId =
  | "receive"
  | "extract"
  | "validate"
  | "route"
  | "investigate"
  | "approve"
  | "post"
  | "notify";

export interface StepDef {
  id: StepId;
  name: string;
  kind: StepKind;
  summary: string;
}

export const STEPS: StepDef[] = [
  {
    id: "receive",
    name: "Receive",
    kind: "code",
    summary: "Store the PDF and derive an idempotency key from its hash.",
  },
  {
    id: "extract",
    name: "Extract",
    kind: "model",
    summary: "One model call turns the PDF into a typed record (structured outputs).",
  },
  {
    id: "validate",
    name: "Validate",
    kind: "code",
    summary: "Check the arithmetic, the PO and the vendor against the systems of record.",
  },
  {
    id: "route",
    name: "Route",
    kind: "code",
    summary: "Apply the approval policy. Plain if/else, no model.",
  },
  {
    id: "investigate",
    name: "Investigate",
    kind: "agent",
    summary:
      "Only on exceptions: a bounded agent with read-only tools writes a note for the reviewer.",
  },
  {
    id: "approve",
    name: "Approve",
    kind: "human",
    summary: "Only when policy says so: the workflow sleeps until a person decides.",
  },
  {
    id: "post",
    name: "Post to ERP",
    kind: "code",
    summary: "Write the bill with the invoice number as the idempotency key.",
  },
  {
    id: "notify",
    name: "Notify",
    kind: "model",
    summary: "A model drafts a one-line summary; a template takes over if it fails.",
  },
];

export const stepById = Object.fromEntries(STEPS.map((step) => [step.id, step])) as Record<
  StepId,
  StepDef
>;

export const KIND_LABEL: Record<StepKind, string> = {
  code: "code",
  model: "model",
  agent: "agent",
  human: "human",
};

export const APPROVAL_LIMIT = 10_000;

/** Fixed en-US money format, so server and client render the same string. */
export function money(amount: number): string {
  const [whole, cents] = amount.toFixed(2).split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${cents}`;
}

export function clock(seconds: number): string {
  if (seconds < 60) return `+${seconds}s`;
  if (seconds < 3600) return `+${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `+${hours}h ${String(minutes).padStart(2, "0")}m`;
}

/* ---------- Happy path, step by step ---------- */

const lineItems = [
  { description: "Pallet racking, 3 m bay", quantity: 4, unit_price: 1850 },
  { description: "Installation labour", quantity: 1, unit_price: 1020 },
];

export interface PipelineStage {
  step: StepId;
  /** Why this step ran or was skipped on the happy path. */
  note: string;
  skipped?: boolean;
  input?: unknown;
  output?: unknown;
}

export const HAPPY_PATH: PipelineStage[] = [
  {
    step: "receive",
    note: "Code stores the PDF and starts one run per file hash, so a resent email can't start a second run.",
    input: { from: "billing@northwind.example", attachment: "NW-20931.pdf", bytes: 48211 },
    output: { instance_id: "inv-9c1e4b", pdf_key: "r2://invoices/9c1e4b.pdf" },
  },
  {
    step: "extract",
    note: "The only step that reads messy input. Output is forced to a JSON schema, so it parses unless the model refuses or runs out of tokens. Whether the numbers are right is the next step's job.",
    input: { pdf_key: "r2://invoices/9c1e4b.pdf", schema: "Invoice v3" },
    output: {
      vendor: "Northwind Supplies",
      invoice_number: "NW-20931",
      po_number: "PO-4471",
      currency: "USD",
      line_items: lineItems,
      total: 8420,
    },
  },
  {
    step: "validate",
    note: "Code checks the model's claims: do the lines add up, does the PO exist, is the vendor active. Same input, same answer.",
    input: { invoice_number: "NW-20931", po_number: "PO-4471", total: 8420 },
    output: {
      lines_sum_to_total: true,
      po_exists: true,
      po_remaining: 20000,
      vendor_active: true,
      duplicate: false,
    },
  },
  {
    step: "route",
    note: "The approval policy is an if statement. Under the limit with every check passing goes straight through.",
    input: { total: 8420, checks_passed: true },
    output: {
      decision: "auto_approve",
      reason: `total under ${money(APPROVAL_LIMIT)}, all checks passed`,
    },
  },
  {
    step: "investigate",
    skipped: true,
    note: "Didn't run: nothing failed validation. This agent only wakes up for exceptions.",
  },
  {
    step: "approve",
    skipped: true,
    note: "Didn't run: the policy auto-approved, so no person was asked.",
  },
  {
    step: "post",
    note: "The invoice number is the idempotency key, so a retry returns the same bill instead of a second one.",
    input: { idempotency_key: "NW-20931", amount: 8420, po_number: "PO-4471" },
    output: { erp_document: "AP-55120", status: "posted" },
  },
  {
    step: "notify",
    note: "Low stakes, so a model writes it. If the model is down, a template sends the same facts.",
    input: { erp_document: "AP-55120", vendor: "Northwind Supplies", total: 8420 },
    output: {
      channel: "#accounts-payable",
      message: "Posted Northwind NW-20931 (8,420.00 USD) against PO-4471 as AP-55120.",
    },
  },
];

/* ---------- Failure simulation ---------- */

export interface Scenario {
  modelOverloaded: boolean;
  misreadTotal: boolean;
  overLimit: boolean;
  crashAfterValidate: boolean;
  approverRejects: boolean;
  erpTimeout: boolean;
  summaryDown: boolean;
}

export const NO_FAILURES: Scenario = {
  modelOverloaded: false,
  misreadTotal: false,
  overLimit: false,
  crashAfterValidate: false,
  approverRejects: false,
  erpTimeout: false,
  summaryDown: false,
};

export const SCENARIO_LABELS: { key: keyof Scenario; label: string; hint: string }[] = [
  {
    key: "modelOverloaded",
    label: "Model API is overloaded",
    hint: "The first extract call returns 529.",
  },
  {
    key: "misreadTotal",
    label: "Model misreads the total",
    hint: "Valid JSON, wrong number: 8,240 instead of 8,420.",
  },
  {
    key: "overLimit",
    label: "Invoice is over the approval limit",
    hint: `Nine bays instead of four: 17,670.00, over ${money(APPROVAL_LIMIT)}.`,
  },
  {
    key: "crashAfterValidate",
    label: "Worker restarts mid-run",
    hint: "The machine goes away right after validation.",
  },
  {
    key: "approverRejects",
    label: "Approver rejects",
    hint: "Only matters if a person is asked.",
  },
  {
    key: "erpTimeout",
    label: "ERP times out after writing",
    hint: "The bill was saved, the response was lost.",
  },
  {
    key: "summaryDown",
    label: "Summary model is down",
    hint: "Every notify attempt fails.",
  },
];

export type TraceStatus =
  | "ok"
  | "retry"
  | "failed"
  | "replayed"
  | "waiting"
  | "fallback"
  | "flagged"
  | "crash";

export interface TraceEvent {
  at: number;
  step: StepId | "runtime";
  status: TraceStatus;
  text: string;
}

export interface Outcome {
  result: "posted" | "rejected";
  modelCalls: number;
  agentToolCalls: number;
  retries: number;
  humanTouches: number;
  elapsed: number;
}

export function simulate(scenario: Scenario): { trace: TraceEvent[]; outcome: Outcome } {
  const trace: TraceEvent[] = [];
  let at = 0;
  let modelCalls = 0;
  let agentToolCalls = 0;
  let retries = 0;
  let humanTouches = 0;
  const log = (step: TraceEvent["step"], status: TraceStatus, text: string, advance = 1) => {
    at += advance;
    trace.push({ at, step, status, text });
  };

  const actualTotal = scenario.overLimit ? 17670 : 8420;
  const extractedTotal = scenario.misreadTotal ? (scenario.overLimit ? 17760 : 8240) : actualTotal;

  log("receive", "ok", "Stored NW-20931.pdf. Instance id inv-9c1e4b from the file hash.", 0);

  if (scenario.modelOverloaded) {
    modelCalls++;
    retries++;
    log(
      "extract",
      "retry",
      "Model API returned 529 overloaded. Retry 1 of 5 in 10s, exponential backoff.",
      2,
    );
    at += 10;
  }
  modelCalls++;
  log("extract", "ok", `Schema-valid record. total = ${money(extractedTotal)}.`, 4);

  const sumMatches = extractedTotal === actualTotal;
  log(
    "validate",
    sumMatches ? "ok" : "flagged",
    sumMatches
      ? "Line items sum to the total. PO-4471 open with 20,000.00 left. Vendor active. Not a duplicate."
      : `Line items sum to ${money(actualTotal)} but total reads ${money(extractedTotal)}. Flagged.`,
  );

  if (scenario.crashAfterValidate) {
    log("runtime", "crash", "Worker evicted. The instance resumes on another machine.", 3);
    for (const step of ["receive", "extract", "validate"] as const) {
      log(step, "replayed", "Returned the saved result. Not run again, no model call.", 0);
    }
  }

  const needsApproval = !sumMatches || actualTotal > APPROVAL_LIMIT;
  if (!sumMatches) {
    log("route", "flagged", "Exception: validation failed. Send to investigation, then a person.");
    agentToolCalls += 3;
    modelCalls += 4;
    log("investigate", "ok", "Turn 1: get_purchase_order(PO-4471). Turn 2: get_pdf_page(1).", 6);
    log(
      "investigate",
      "ok",
      `Turn 3: get_vendor_history(Northwind). Note: PDF shows ${money(actualTotal)}; extraction swapped two digits. Stopped after 4 of 8 allowed turns.`,
      5,
    );
  } else if (needsApproval) {
    log(
      "route",
      "flagged",
      `Needs approval: ${money(actualTotal)} is over ${money(APPROVAL_LIMIT)}.`,
    );
  } else {
    log("route", "ok", `Auto-approve: under ${money(APPROVAL_LIMIT)}, all checks passed.`);
  }

  let rejected = false;
  if (needsApproval) {
    log(
      "approve",
      "waiting",
      "Sleeping until an approval event arrives (timeout 7 days). Nothing is running.",
    );
    humanTouches++;
    rejected = scenario.approverRejects;
    at += 2 * 3600;
    log(
      "approve",
      rejected ? "failed" : "ok",
      rejected
        ? "Rejected by the reviewer. The workflow skips the ERP write."
        : `Approved by the reviewer at ${money(actualTotal)}.`,
      0,
    );
  }

  if (!rejected) {
    if (scenario.erpTimeout) {
      retries++;
      log("post", "retry", "Timed out after 30s. The bill was written; the response was lost.", 30);
      log(
        "post",
        "ok",
        "Retry with key NW-20931. ERP returns existing AP-55120. No duplicate bill.",
        10,
      );
    } else {
      log("post", "ok", `Posted AP-55120 for ${money(actualTotal)} USD.`, 2);
    }
  }

  if (scenario.summaryDown) {
    modelCalls += 3;
    retries += 2;
    log("notify", "retry", "Summary model failed. Retry 1 of 2.", 2);
    log("notify", "retry", "Summary model failed. Retry 2 of 2.", 4);
    log("notify", "fallback", "Retries used up. Sent the template message instead.", 8);
  } else {
    modelCalls++;
    log(
      "notify",
      "ok",
      rejected
        ? "Told #accounts-payable the invoice was rejected."
        : "Posted a one-line summary to #accounts-payable.",
      2,
    );
  }

  return {
    trace,
    outcome: {
      result: rejected ? "rejected" : "posted",
      modelCalls,
      agentToolCalls,
      retries,
      humanTouches,
      elapsed: at,
    },
  };
}

/* ---------- Determinism dial ---------- */

export interface DialLevel {
  name: string;
  summary: string;
  kinds: Partial<Record<StepId, StepKind>>;
  /** When set, the whole run is one agent loop with these tools. */
  agentTools?: string[];
  /** Tools whose calls wait for a person. */
  gatedTools?: string[];
  scores: { predictable: number; messyInput: number; cheap: number; auditable: number };
  goodFor: string;
  breaksWhen: string;
}

const allCode: Record<StepId, StepKind> = {
  receive: "code",
  extract: "code",
  validate: "code",
  route: "code",
  investigate: "human",
  approve: "human",
  post: "code",
  notify: "code",
};

export const DIAL_LEVELS: DialLevel[] = [
  {
    name: "All code",
    summary: "Per-vendor templates and regex pull fields out of the PDF. No model anywhere.",
    kinds: allCode,
    scores: { predictable: 5, messyInput: 1, cheap: 5, auditable: 5 },
    goodFor: "A handful of vendors whose PDFs never change.",
    breaksWhen: "A new vendor or a new layout arrives. Someone writes another parser.",
  },
  {
    name: "Model as a function",
    summary: "One structured-output call replaces the parsers. Everything around it stays code.",
    kinds: { ...allCode, extract: "model" },
    scores: { predictable: 4, messyInput: 4, cheap: 4, auditable: 5 },
    goodFor: "Most extraction and classification jobs. Start here.",
    breaksWhen: "Exceptions pile up in a human queue with no context attached.",
  },
  {
    name: "Workflow with a boxed agent",
    summary:
      "Model steps where input is messy, code everywhere else, and a bounded agent only on exceptions.",
    kinds: { ...allCode, extract: "model", investigate: "agent", notify: "model" },
    scores: { predictable: 4, messyInput: 5, cheap: 4, auditable: 4 },
    goodFor: "The system in this post: the path is known, a few steps need judgment.",
    breaksWhen: "The process itself changes per case, so there is no fixed path to write down.",
  },
  {
    name: "Agent with guardrails",
    summary:
      "An agent decides the order of steps. Code checks tool inputs, and the ERP write needs a human.",
    kinds: {},
    agentTools: ["read_pdf", "get_purchase_order", "check_vendor", "post_to_erp", "send_message"],
    gatedTools: ["post_to_erp"],
    scores: { predictable: 2, messyInput: 5, cheap: 2, auditable: 3 },
    goodFor: "Open-ended work where the steps cannot be listed ahead of time.",
    breaksWhen: "The same answer is needed twice, or an auditor asks why step 4 ran before step 3.",
  },
  {
    name: "Autonomous agent",
    summary: "One prompt, every tool, no fixed path. The agent decides when it is done.",
    kinds: {},
    agentTools: ["read_pdf", "query_erp", "post_to_erp", "send_message", "send_email"],
    scores: { predictable: 1, messyInput: 5, cheap: 1, auditable: 2 },
    goodFor: "Exploration and one-off tasks with a person watching.",
    breaksWhen: "It runs unattended against systems of record. One bad turn posts a bill.",
  },
];

export const SCORE_LABELS: { key: keyof DialLevel["scores"]; label: string }[] = [
  { key: "predictable", label: "Same input, same path" },
  { key: "messyInput", label: "Handles messy input" },
  { key: "cheap", label: "Cheap per run" },
  { key: "auditable", label: "Easy to audit" },
];

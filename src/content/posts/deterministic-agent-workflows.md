---
title: "Building Deterministic Agent Workflows"
description: "How to keep agent workflows deterministic, with interactive demos and code for Cloudflare, AWS and pi-durable."
date: "2026-11-11"
tags: ["ai"]
published: true
---

This post is about building deterministic workflows with probabilistic agents.

The LLM/AI is probabilistic. The workflow becomes deterministic when you keep the model's job small:

## Core Idea

Use actual code to decide what happens next, store the state, and make every change.

The model handles only the parts that need judgment, and then code again checks model's output like any other untrusted input.


Anthropic's [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) proposes similar approaches. In a **workflow**, code decides the steps. In an **agent**, the model decides them as it goes.

Most real jobs need a workflow with a few model steps. Some also need a small agent inside one of those steps. OpenAI's [guide to building agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) gives the same advice:

_If a job doesn't clearly need an agent, "a deterministic solution may suffice."_

## Example: processing an invoice

Email arrives with a PDF invoice attached. System reads the invoice and checks it against the matching purchase order. If needed, it asks a person to approve the invoice. Then records the bill in the accounting system, called the ERP, and tells the accounts payable team.

Each step in the diagram is one of four things: plain **code**, a single **model** call, a tightly limited **agent**, or a **human**.

<post-demo name="agent-pipeline">
Interactive demo: an invoice moves through eight steps (receive, extract, validate, route, investigate, approve, post to ERP, notify). Each step is labelled code, model, agent or human. Open the post on saad.sh to use it.
</post-demo>

The model reads the PDF and writes the final message. Code or a person makes every decision that moves money.

## Six rules keep the model's job small

In short:

- Code makes every decision
- Code limits and checks the model's output
- The engine saves every step
- Every write is safe to repeat
- People approve the risky actions
- The one agent can investigate but can never act

**1. Code decides what happens next.** The model returns data, never instructions. Suppose a model sorts an invoice into a category. It returns one value from a fixed list, and code decides what to do with that value.

**2. Limit what the model can return, then check it.** [Anthropic](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) and [OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs) both support structured outputs, which force the response to match a JSON Schema. A matching response is well-formed. It is not necessarily correct, so code still compares the numbers with the purchase order.

Same principle: don't trust anything that comes out of the model 😀.

```ts
const res = await claude.messages.create({
  model: "claude-sonnet-5-5",
  max_tokens: 2048,
  output_config: { format: { type: "json_schema", schema: invoiceSchema } },
  messages: [{ role: "user", content: [pdf, { type: "text", text: "Extract this invoice." }] }],
});
if (res.stop_reason !== "end_turn") throw new NonRetryableError(res.stop_reason);
```

Structured outputs have one gap: if the model refuses or runs out of tokens, the response may not match the schema. The `stop_reason` check catches both cases.

**3. Save every step.** The workflow engine stores the result of each step when the step finishes. If the server crashes halfway through, the run resumes where it stopped and reuses the saved results instead of calling the model again. A fixed policy controls retries. The engine retries temporary errors with growing delays and stops the run on permanent errors.

```ts
const invoice = await step.do(
  "extract",
  { retries: { limit: 5, delay: "10 seconds", backoff: "exponential" } },
  () => extractInvoice(pdfKey),
);
```

Cloudflare's [rules of Workflows](https://developers.cloudflare.com/workflows/build/rules-of-workflows/) work as a checklist for any engine: give steps fixed names, keep no state outside steps, branch only on step results.

**4. Make every write safe to repeat.** Each write carries a key taken from the business data, such as the file hash or the invoice number. When the system retries a write, it returns the first result instead of creating a second bill.

```ts
await env.INVOICE_WORKFLOW.create({ id: fileHash, params: { pdfKey } }); // a duplicate id throws: catch it and use get(id)
await erp.postBill(bill, { idempotencyKey: invoice.number }); // one bill per invoice
```

**5. Treat people as a step.** The approval step sends a request and then sleeps until someone answers. Nothing runs during the wait, so you pay no compute for it. OpenAI's guide names two cases that call for a person: too many failures, and high-risk actions such as payments.

```ts
const decision = await step.waitForEvent<Approval>("approval", {
  type: "invoice-approval",
  timeout: "7 days",
});
```

On Cloudflare, a timeout throws an error. Catch it and route the run to a rejection path.

**6. Keep the agent on a short leash.** Sometimes an invoice doesn't match its purchase order. Finding out *why* is open-ended work, so that one step is an agent. The agent can only read data and has a limited number of turns. Its output is a note for the person who reviews the invoice. It never acts on its own.

## When something goes wrong

Real runs can fail many ways. The demo below switches failures on one at a time and replays the run with each one.

<post-demo name="agent-failures">
Interactive demo: switch on failures (model overloaded, model misreads the total, over the approval limit, worker restart, approver rejects, ERP timeout after writing, summary model down) and replay the run to see retries, replayed steps, the agent, the approval wait and the idempotent ERP write. Open the post on saad.sh to use it.
</post-demo>

Try "Worker restarts mid-run" together with "Model misreads the total". The restart reuses the saved steps and does not call the model again. The wrong total never reaches the ERP, because the validation step catches it first.

## The same ideas on Cloudflare, AWS, and pi-durable

Cloudflare Workflows and AWS Step Functions are general workflow engines. [pi-durable](https://github.com/earendil-works/pi/tree/main/packages/durable) is built for agents. It already saves every model turn and every tool call as a step, so an agent gets crash recovery, retries, and approvals without wrapping each call by hand. I find it the nicest of the three for agent code. All three platforms offer the same building blocks under different names:

| Need | Cloudflare Workflows | AWS Step Functions | pi-durable |
| --- | --- | --- | --- |
| Durable step | `step.do` | A state | A task phase, or a tool call |
| Retries | `retries: { limit, delay, backoff }` | `Retry` with `MaxAttempts`, `BackoffRate` | `settings.retry` for model calls, `restartLimit` for crashes |
| Stop retrying | `NonRetryableError` | `Retry` with `MaxAttempts: 0` for that error, then `Catch` | A throwing phase faults its task |
| Routing | `if` on a step result | `Choice` state | Code picks the next phase |
| Human approval | `step.waitForEvent` | `.waitForTaskToken` | `defineSignal` and `harness.signal` |
| Fan out | `Promise.all` over `step.do` | `Parallel` or `Map` | Child tasks with `policy: "allSettled"` |

On Step Functions, the approval step is a single state. The run pauses until another service calls `SendTaskSuccess` with the token.

```json
"RequestApproval": {
  "Type": "Task",
  "Resource": "arn:aws:states:::sqs:sendMessage.waitForTaskToken",
  "Parameters": { "QueueUrl": "…", "MessageBody": { "taskToken.$": "$$.Task.Token" } },
  "Next": "PostToErp"
}
```

In pi-durable, the approval can sit directly in front of the risky tool. A `beforeTool` hook parks the agent's `post_to_erp` call until a person answers. If nobody answers within a day, the hook blocks the call.

```ts
const DAY = 24 * 60 * 60 * 1000;
const Approval = defineSignal({ name: "invoice.approval", version: 1, schema: obj({ allow: bool() }) });

const RequireApproval = defineExtension({
  name: "require-approval",
  hooks: [
    hook(ToolTask, {
      beforeTool: async (call, api, context) => {
        if (call.name !== "post_to_erp") return undefined;
        const key = digest(call.arguments); // the approval covers these exact arguments
        const state = await api.readSignal(Approval, key, context);
        const until = await api.memo(`approval.until.${key}`, api.now() + DAY, context);
        if (state === undefined) return { sleep: { signals: [Approval.key(key)], until } };
        if ("expired" in state) return { block: "No approval within a day" };
        return state.value.allow ? undefined : { block: "Not approved" };
      },
    }),
  ],
});
```

The approval screen answers with `harness.signal(taskId, Approval, key, { allow: true }, context)`. Nothing runs while the call waits. The memoized deadline survives restarts.

## Five workflow patterns and the agent loop

Anthropic describes five common ways to arrange model calls inside a workflow. It also describes the agent loop, where the model decides the steps. The demo below shows each one on the same invoice system, with a build for each platform.

<post-demo name="agent-patterns">
Interactive demo: animated diagrams of prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer and the agent loop, each mapped to the invoice system and to Cloudflare Workflows, AWS Step Functions and pi-durable. Open the post on saad.sh to use it.
</post-demo>

Only the agent loop lets the model decide the whole path.

## Decide how much the model controls

Between all code and a fully autonomous agent, there is a range of designs. The slider below moves the same invoice job along that range.

<post-demo name="agent-dial">
Interactive demo: a slider from "all code" to "autonomous agent" for the same invoice job, showing which steps become model or agent steps and how predictability, cost and auditability change. Open the post on saad.sh to use it.
</post-demo>

The slider starts at an agent with guardrails. The agent picks the order of steps, code checks every tool call, and a person approves the one write that moves money. Anthropic still recommends finding "the simplest solution possible." If you know the path ahead of time, the levels to the left are simpler and cheaper. Use the fully autonomous end only when a person watches the run.

## What "deterministic" means here

The model's wording still varies from run to run. Everything around the model stays fixed:

- **The path.** The same step results always lead to the same next step.
- **The changes.** Each write happens once, no matter how many retries occur.
- **The recovery.** A resumed run reuses every finished step instead of asking the model again.
- **The record.** The engine saves every step's input and output, so you can audit any run later.

## Sources

- Anthropic: [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents), [Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents), [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- OpenAI: [A practical guide to building agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf), [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- Google: [ADK workflow agents](https://adk.dev/agents/workflow-agents/) (now superseded by [graph workflows](https://adk.dev/graphs/))
- Earendil: [pi-durable](https://github.com/earendil-works/pi/tree/main/packages/durable)
- Cloudflare: [Workflows](https://developers.cloudflare.com/workflows/), [Rules of Workflows](https://developers.cloudflare.com/workflows/build/rules-of-workflows/), [Run Workflows from an Agent](https://developers.cloudflare.com/agents/agent-class/run-workflows/), [Human-in-the-loop](https://developers.cloudflare.com/agents/concepts/agentic-patterns/human-in-the-loop/)
- AWS: [Step Functions error handling](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-error-handling.html), [Task token callbacks](https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html#connect-wait-token), [Bedrock integration](https://docs.aws.amazon.com/step-functions/latest/dg/connect-bedrock.html), [Agentic AI patterns on AWS](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/introduction.html)

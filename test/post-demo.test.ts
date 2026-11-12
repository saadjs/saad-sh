import { describe, expect, it } from "vitest";
import { demoNames } from "#/components/PostDemo";
import { NO_FAILURES, money, simulate } from "#/components/demos/agent-workflow/model";
import { renderMarkdown } from "#/lib/markdown";
import { getAllPostsWithBody } from "#/lib/posts";

describe("post-demo embeds", () => {
  it("parses a <post-demo> block into its own element, not a paragraph", async () => {
    const hast = await renderMarkdown(
      'Before.\n\n<post-demo name="agent-dial">\nFallback.\n</post-demo>\n\nAfter.',
    );
    const demo = hast.children.find(
      (node) => node.type === "element" && node.tagName === "post-demo",
    );
    expect(demo).toMatchObject({ properties: { name: "agent-dial" } });
  });

  it("only uses registered demo names in posts", async () => {
    for (const post of await getAllPostsWithBody()) {
      for (const [, name] of post.body.matchAll(/<post-demo name="([^"]+)">/g)) {
        expect(demoNames, `${post.slug} uses ${name}`).toContain(name);
      }
    }
  });
});

describe("invoice simulation", () => {
  it("auto-approves the clean invoice with no people and no retries", () => {
    const { trace, outcome } = simulate(NO_FAILURES);
    expect(outcome).toMatchObject({
      result: "posted",
      humanTouches: 0,
      retries: 0,
      agentToolCalls: 0,
    });
    expect(trace.some((event) => event.step === "approve")).toBe(false);
  });

  it("replays saved steps after a restart without new model calls", () => {
    const base = simulate(NO_FAILURES).outcome.modelCalls;
    const { trace, outcome } = simulate({ ...NO_FAILURES, crashAfterValidate: true });
    expect(outcome.modelCalls).toBe(base);
    expect(trace.filter((event) => event.status === "replayed").map((event) => event.step)).toEqual(
      ["receive", "extract", "validate"],
    );
  });

  it("sends a misread total through the agent to a person", () => {
    const { trace, outcome } = simulate({ ...NO_FAILURES, misreadTotal: true });
    expect(trace.some((event) => event.step === "investigate")).toBe(true);
    expect(outcome.humanTouches).toBe(1);
    expect(outcome.agentToolCalls).toBeGreaterThan(0);
  });

  it("posts nothing when the approver rejects", () => {
    const { trace, outcome } = simulate({ ...NO_FAILURES, overLimit: true, approverRejects: true });
    expect(outcome.result).toBe("rejected");
    expect(trace.some((event) => event.step === "post")).toBe(false);
  });

  it("posts exactly once when the ERP times out after writing", () => {
    const { trace } = simulate({ ...NO_FAILURES, erpTimeout: true });
    expect(trace.filter((event) => event.step === "post" && event.status === "ok")).toHaveLength(1);
  });

  it("formats money the same everywhere", () => {
    expect(money(17670)).toBe("17,670.00");
    expect(money(8420)).toBe("8,420.00");
  });
});

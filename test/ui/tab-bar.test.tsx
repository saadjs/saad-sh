import { describe, expect, it } from "vitest";
import { trackScroll } from "#/components/TabBar";
import { isNavActive } from "#/lib/nav";

describe("tab bar", () => {
  const viewport = 800;
  const page = 5000;

  it("steps aside when the reader scrolls down and returns when they scroll up", () => {
    let state = { anchor: 300, down: false };
    state = trackScroll(state, 340, viewport, page);
    expect(state.down).toBe(true);
    state = trackScroll(state, 900, viewport, page);
    expect(state.down).toBe(true);
    state = trackScroll(state, 860, viewport, page);
    expect(state.down).toBe(false);
  });

  it("ignores scroll jitter in either direction", () => {
    const hidden = { anchor: 600, down: true };
    expect(trackScroll(hidden, 594, viewport, page)).toBe(hidden);
    const shown = { anchor: 600, down: false };
    expect(trackScroll(shown, 608, viewport, page)).toBe(shown);
  });

  it("always shows at the top and at the end of the page", () => {
    expect(trackScroll({ anchor: 0, down: false }, 40, viewport, page).down).toBe(false);
    expect(
      trackScroll({ anchor: 4000, down: true }, page - viewport - 10, viewport, page).down,
    ).toBe(false);
  });

  it("marks one tab for each section", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/posts/some-post", "/")).toBe(false);
    expect(isNavActive("/posts/some-post", "/posts")).toBe(true);
    expect(isNavActive("/tags/ai", "/posts")).toBe(true);
    expect(isNavActive("/projects", "/posts")).toBe(false);
    expect(isNavActive("/projectsx", "/projects")).toBe(false);
  });
});

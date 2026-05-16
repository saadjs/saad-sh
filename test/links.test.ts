import { describe, expect, it } from "vitest";
import { getLinkNavigationProps, isExternalHttpHref } from "#/lib/links";

describe("link navigation props", () => {
  it("opens external HTTP links in a new tab", () => {
    expect(getLinkNavigationProps({ href: "https://example.com" })).toEqual({
      rel: "noreferrer",
      target: "_blank",
    });
  });

  it("keeps same-site links in the current tab", () => {
    expect(isExternalHttpHref("/posts/example")).toBe(false);
    expect(isExternalHttpHref("https://saad.sh/posts/example")).toBe(false);
    expect(getLinkNavigationProps({ href: "/posts/example" })).toEqual({
      rel: undefined,
      target: undefined,
    });
  });

  it("preserves explicit targets and secures blank targets", () => {
    expect(getLinkNavigationProps({ href: "https://example.com", target: "_self" })).toEqual({
      rel: undefined,
      target: "_self",
    });

    expect(
      getLinkNavigationProps({ href: "/posts/example", rel: "noopener", target: "_blank" }),
    ).toEqual({
      rel: "noopener noreferrer",
      target: "_blank",
    });
  });
});

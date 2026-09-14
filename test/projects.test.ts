import { describe, expect, it } from "vitest";
import { projects, projectSlug, resolveProjectLink } from "#/lib/projects";
import { getPostSlugs } from "#/lib/posts";
import { seedContent } from "./seed";

describe("project link resolution", () => {
  it("keeps same-origin absolute links client-side", () => {
    expect(resolveProjectLink("https://saad.sh")).toEqual({ kind: "route", to: "/" });
    expect(resolveProjectLink("https://saad.sh/posts/example")).toEqual({
      kind: "post",
      slug: "example",
    });
  });

  it("treats other origins and unrouted paths as plain anchors", () => {
    expect(resolveProjectLink("https://github.com/saadjs/hush")).toEqual({
      kind: "external",
      href: "https://github.com/saadjs/hush",
    });
    expect(resolveProjectLink("/og/projects.png")).toEqual({
      kind: "external",
      href: "/og/projects.png",
    });
  });

  it("points every internal project link at a post that exists", async () => {
    await seedContent();
    const slugs = new Set(await getPostSlugs());

    for (const project of projects) {
      for (const link of project.links) {
        const target = resolveProjectLink(link.href);
        if (target.kind !== "post") continue;
        expect(slugs, `${project.name} → ${link.href}`).toContain(target.slug);
      }
    }
  });
});

describe("project slugs", () => {
  it("gives every project a unique, non-empty anchor", () => {
    const slugs = projects.map((project) => projectSlug(project.name));
    expect(slugs.every(Boolean)).toBe(true);
    expect(new Set(slugs).size).toBe(projects.length);
  });

  it("falls back rather than returning an empty slug", () => {
    expect(projectSlug("+++")).toBe("project");
  });
});

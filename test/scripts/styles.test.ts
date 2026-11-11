// @vitest-environment node
// Checks every style folder against the contract in src/styles/README.md, and
// the rule that decides which style a visitor gets.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { randomOther, resolveStyle } from "#/styles/resolve";

const root = join(import.meta.dirname, "../..");
const stylesDir = join(root, "src/styles");
const folders = readdirSync(stylesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const registry = readFileSync(join(stylesDir, "index.ts"), "utf8");
const requiredTokens = [
  "--background",
  "--surface",
  "--foreground",
  "--muted",
  "--border",
  "--accent",
  "--accent-fg",
];

describe.each(folders)("style %s", (id) => {
  const index = readFileSync(join(stylesDir, id, "index.tsx"), "utf8");
  const css = readFileSync(join(stylesDir, id, "style.css"), "utf8");

  it("uses its folder name as its id and is imported by the registry", () => {
    expect(index).toMatch(new RegExp(`\\bid: "${id}"`));
    expect(index).toMatch(new RegExp(`export const ${id}: StyleDefinition`));
    expect(registry).toContain(`from "./${id}"`);
  });

  it("only imports from the kit and its own folder", () => {
    const sources = [...index.matchAll(/from "([^"]+)"/g)].map((match) => match[1]);
    for (const source of sources) {
      expect(source === "#/styles/kit" || source === "react" || source.startsWith("./")).toBe(true);
    }
  });

  it("defines every required token", () => {
    for (const token of requiredTokens) expect(css).toContain(`${token}:`);
  });

  it("has a dark palette exactly when it follows the light/dark toggle", () => {
    const themes = index.match(/themes: "(both|light|dark)"/)?.[1];
    expect(themes).toBeDefined();
    expect(css.includes('[data-theme="dark"]')).toBe(themes === "both");
  });

  it("only references font files that exist", () => {
    const used = [...css.matchAll(/url\("\/fonts\/([^"]+)"\)/g)].map((match) => match[1]);
    const preloaded = (index.match(/fonts: \[([^\]]*)\]/)?.[1] ?? "")
      .split(",")
      .map((name) => name.trim().replaceAll('"', ""))
      .filter(Boolean)
      .map((name) => `${name}.woff2`);
    for (const file of [...used, ...preloaded]) {
      expect(existsSync(join(root, "public/fonts", file)), file).toBe(true);
    }
    // A preloaded font that the stylesheet never uses is a wasted download.
    for (const file of preloaded) expect(used).toContain(file);
  });
});

describe("resolveStyle", () => {
  const ids = ["ledger", "plain", "arcade"];
  const base = { ids, fallback: "ledger", picker: true };

  it("gives new visitors the default without saving it", () => {
    expect(resolveStyle(base)).toEqual({ id: "ledger", persist: false });
  });

  it("honours a saved choice", () => {
    expect(resolveStyle({ ...base, saved: "arcade" })).toEqual({ id: "arcade", persist: false });
  });

  it("ignores a saved style that no longer exists", () => {
    expect(resolveStyle({ ...base, saved: "sketchbook" }).id).toBe("ledger");
  });

  it("picks a random style once and asks for it to be saved", () => {
    const choice = resolveStyle({ ...base, fallback: "random", random: () => 0.99 });
    expect(choice).toEqual({ id: "arcade", persist: true });
    expect(resolveStyle({ ...base, fallback: "random", saved: "plain" })).toEqual({
      id: "plain",
      persist: false,
    });
  });

  it("locks everyone to the default when the picker is off", () => {
    expect(resolveStyle({ ...base, picker: false, saved: "arcade" }).id).toBe("ledger");
  });

  it("falls back to the first style when the default is unknown", () => {
    expect(resolveStyle({ ...base, fallback: "nope" }).id).toBe("ledger");
  });

  it("never returns the current style from Random when there is another", () => {
    for (const roll of [0, 0.5, 0.99]) {
      expect(randomOther(ids, "ledger", () => roll)).not.toBe("ledger");
    }
    expect(randomOther(["ledger"], "ledger")).toBe("ledger");
  });
});

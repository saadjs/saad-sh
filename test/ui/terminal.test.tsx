import { describe, expect, it } from "vitest";
import {
  complete,
  cwdFromPath,
  initialState,
  run,
  type TerminalHost,
  type TerminalState,
} from "#/lib/terminal";

const posts = [
  {
    slug: "git-undo-last-commit",
    title: "Undo the last commit",
    date: "2025-03-01T00:00:00.000Z",
    tags: ["Git"],
    searchText: "undo the last commit git amend",
  },
  {
    slug: "git-worktrees",
    title: "Worktrees",
    date: "2026-01-15T00:00:00.000Z",
    tags: ["Git", "AI Tools"],
    searchText: "worktrees git agents",
  },
  {
    slug: "zod-env",
    title: "Validate env vars with Zod",
    date: "2024-06-09T00:00:00.000Z",
    tags: ["TypeScript"],
    searchText: "validate env vars with zod typescript",
  },
];

const host: TerminalHost = {
  posts,
  projects: [
    {
      slug: "pane",
      name: "Pane",
      description: "A window manager.",
      tags: ["Swift"],
      links: [{ label: "GitHub", href: "https://github.com/saadjs/pane-wm" }],
    },
  ],
  styles: [
    { id: "paper", name: "Paper", blurb: "Serif" },
    { id: "arcade", name: "Arcade", blurb: "Pixels" },
    { id: "dusk", name: "Dusk", blurb: "Dark" },
  ],
  styleId: "paper",
  theme: "light",
  readPost: async (slug) => `# ${slug}\n\nBody of ${slug}.\n`,
  now: () => new Date("2026-11-17T09:30:00Z"),
  random: () => 0.99,
};

const at = (...cwd: string[]): TerminalState => ({ ...initialState, cwd });
const text = (lines: { text: string }[]) => lines.map((line) => line.text);

describe("terminal", () => {
  it("lists the home directory, with every entry linked to its page", async () => {
    const { lines } = await run("ls", initialState, host);
    expect(lines.map((line) => [line.text, line.href])).toEqual([
      ["about.md", "/about"],
      ["posts/", "/posts"],
      ["projects/", "/projects"],
      ["tags/", "/tags"],
    ]);
  });

  it("shows dates and counts in a long listing, outside the link", async () => {
    const long = await run("ls -l posts", initialState, host);
    expect(long.lines[0]).toMatchObject({
      lead: "2025-03-01  ",
      text: "git-undo-last-commit.md",
      href: "/posts/git-undo-last-commit",
    });
    const tags = await run("ls -l tags", initialState, host);
    expect(tags.lines.map((line) => `${line.lead}${line.text}`)).toEqual([
      "1  ai-tools/",
      "2  git/",
      "1  typescript/",
    ]);
  });

  it("moves the page along with cd", async () => {
    const into = await run("cd tags/git", initialState, host);
    expect(into.state.cwd).toEqual(["tags", "git"]);
    expect(into.navigate).toBe("/tags/git");

    const up = await run("cd ../..", into.state, host);
    expect(up.state.cwd).toEqual([]);
    expect(up.navigate).toBe("/");

    const home = await run("cd", at("posts"), host);
    expect(home.navigate).toBe("/");
  });

  it("refuses to cd into a file or somewhere that does not exist", async () => {
    const file = await run("cd posts/zod-env.md", initialState, host);
    expect(file.navigate).toBeUndefined();
    expect(file.state.cwd).toEqual([]);
    expect(text(file.lines)).toEqual(["cd: not a directory: posts/zod-env.md"]);

    const missing = await run("cd nowhere", initialState, host);
    expect(missing.navigate).toBeUndefined();
    expect(text(missing.lines)).toEqual(["cd: nowhere: No such file or directory"]);
  });

  it("prints a post's Markdown, by path or by bare slug from anywhere", async () => {
    const byPath = await run("cat posts/zod-env.md", initialState, host);
    expect(text(byPath.lines)).toEqual(["# zod-env", "", "Body of zod-env."]);
    const bySlug = await run("cat zod-env", at("projects"), host);
    expect(text(bySlug.lines)).toEqual(text(byPath.lines));
  });

  it("only finds a post under a tag it carries", async () => {
    const tagged = await run("cat git-worktrees.md", at("tags", "ai-tools"), host);
    expect(text(tagged.lines)[0]).toBe("# git-worktrees");
    const untagged = await run("cat tags/typescript/git-worktrees.md", initialState, host);
    expect(text(untagged.lines)).toEqual([
      "cat: tags/typescript/git-worktrees.md: No such file or directory",
    ]);
  });

  it("reports a post that cannot be fetched instead of failing", async () => {
    const offline = {
      ...host,
      readPost: async () => {
        throw new Error("offline");
      },
    };
    const { lines } = await run("cat zod-env", initialState, offline);
    expect(lines).toEqual([{ kind: "error", text: "cat: zod-env: could not be read" }]);
  });

  it("prints a project with its links", async () => {
    const { lines } = await run("cat projects/pane.md", initialState, host);
    expect(lines.at(-1)).toMatchObject({
      text: "GitHub: https://github.com/saadjs/pane-wm",
      href: "https://github.com/saadjs/pane-wm",
    });
  });

  it("opens a page and closes", async () => {
    const result = await run("open projects/pane.md", initialState, host);
    expect(result.navigate).toBe("/projects#pane");
    expect(result.exit).toBe(true);
  });

  it("greps post text case-insensitively", async () => {
    const hits = await run("grep GIT", initialState, host);
    expect(hits.lines.map((line) => line.href)).toEqual([
      "/posts/git-undo-last-commit",
      "/posts/git-worktrees",
    ]);
    const none = await run("grep kubernetes", initialState, host);
    expect(none.lines.map((line) => line.href)).toEqual([undefined]);
  });

  it("switches style by id, by name or at random, never to the current one", async () => {
    expect((await run("style arcade", initialState, host)).style).toBe("arcade");
    expect((await run("style Dusk", initialState, host)).style).toBe("dusk");
    expect((await run("style random", initialState, host)).style).toBe("dusk");
    expect((await run("style paper", initialState, host)).style).toBeUndefined();
    expect((await run("style neon", initialState, host)).style).toBeUndefined();
  });

  it("marks the current style in the list", async () => {
    const { lines } = await run("style", initialState, host);
    expect(text(lines).filter((line) => line.startsWith("*"))).toEqual(["* paper   Serif"]);
  });

  it("has nothing to switch when the picker is off", async () => {
    const result = await run("style arcade", initialState, { ...host, styles: [] });
    expect(result.style).toBeUndefined();
    expect(result.lines[0].kind).toBe("error");
  });

  it("toggles the theme, and sets one only when it differs", async () => {
    expect((await run("theme", initialState, host)).theme).toBe("dark");
    expect((await run("theme dark", initialState, host)).theme).toBe("dark");
    expect((await run("theme light", initialState, host)).theme).toBeUndefined();
    expect((await run("theme purple", initialState, host)).theme).toBeUndefined();
  });

  it("leaves the theme alone in a style with one fixed look", async () => {
    const locked = { ...host, styleId: "dusk", theme: "dark", themeLock: "dark" } as const;
    const result = await run("theme light", initialState, locked);
    expect(result.theme).toBeUndefined();
    expect(text(result.lines)).toEqual(["theme: Dusk only comes in dark"]);
  });

  it("keeps a history of what was typed, unknown commands included", async () => {
    const first = await run("pwd", at("posts"), host);
    expect(text(first.lines)).toEqual(["~/posts"]);
    const second = await run("frobnicate", first.state, host);
    expect(text(second.lines)).toEqual(["saad.sh: command not found: frobnicate"]);
    const third = await run("history", second.state, host);
    expect(text(third.lines)).toEqual(["   1  pwd", "   2  frobnicate", "   3  history"]);
  });

  it("ignores names inherited from Object when looking up a command", async () => {
    const { lines } = await run("constructor", initialState, host);
    expect(text(lines)).toEqual(["saad.sh: command not found: constructor"]);
  });

  it("prints the date as YYYY-MM-DD and keeps quoted arguments together", async () => {
    expect(text((await run("date", initialState, host)).lines)).toEqual(["2026-11-17"]);
    expect(text((await run('echo "a  b" c', initialState, host)).lines)).toEqual(["a  b c"]);
  });

  it("holds you in vim until you quit it properly", async () => {
    const opened = await run("vim", initialState, host);
    expect(opened.state.mode).toBe("vim");
    expect(opened.clear).toBe(true);

    const stuck = await run("exit", opened.state, host);
    expect(stuck.state.mode).toBe("vim");
    expect(stuck.exit).toBeUndefined();
    expect(text(stuck.lines)).toEqual(["E492: Not an editor command: exit"]);

    const out = await run(":q!", stuck.state, host);
    expect(out.state.mode).toBe("sh");
    expect(out.state.history).toEqual(["vim"]);
  });

  it("only plays the rm joke for a recursive delete of everything", async () => {
    expect((await run("rm -rf /", initialState, host)).gag).toBe("rm");
    expect((await run("rm -fr ~", initialState, host)).gag).toBe("rm");
    const single = await run("rm posts/zod-env.md", initialState, host);
    expect(single.gag).toBeUndefined();
    expect(text(single.lines)).toEqual(["rm: read-only file system"]);
    expect(text((await run("mkdir x", initialState, host)).lines)).toEqual([
      "mkdir: read-only file system",
    ]);
  });

  it("clears and exits on request", async () => {
    expect((await run("clear", initialState, host)).clear).toBe(true);
    expect((await run("exit", initialState, host)).exit).toBe(true);
    expect(await run("   ", initialState, host)).toEqual({ lines: [], state: initialState });
  });

  it("opens in the directory of the page behind it", () => {
    expect(cwdFromPath("/")).toEqual([]);
    expect(cwdFromPath("/posts/zod-env")).toEqual(["posts"]);
    expect(cwdFromPath("/projects")).toEqual(["projects"]);
    expect(cwdFromPath("/tags")).toEqual(["tags"]);
    expect(cwdFromPath("/tags/ai-tools")).toEqual(["tags", "ai-tools"]);
    expect(cwdFromPath("/about")).toEqual([]);
  });

  describe("tab completion", () => {
    it("finishes a command that has one match", () => {
      expect(complete("gr", initialState, host)).toEqual({ input: "grep ", options: [] });
    });

    it("fills in the shared part of several matches, then lists them", () => {
      expect(complete("cat posts/g", initialState, host)).toEqual({
        input: "cat posts/git-",
        options: [],
      });
      expect(complete("cat posts/git-", initialState, host)).toEqual({
        input: "cat posts/git-",
        options: ["posts/git-undo-last-commit.md", "posts/git-worktrees.md"],
      });
    });

    it("completes relative to the current directory and keeps going into folders", () => {
      expect(complete("cat z", at("posts"), host).input).toBe("cat zod-env.md ");
      expect(complete("ls ta", initialState, host).input).toBe("ls tags/");
      expect(complete("ls ../pro", at("posts"), host).input).toBe("ls ../projects/");
    });

    it("offers only folders to cd", () => {
      expect(complete("cd ", initialState, host).options).toEqual(["posts/", "projects/", "tags/"]);
    });

    it("completes style and theme names", () => {
      expect(complete("style ar", initialState, host).input).toBe("style arcade ");
      expect(complete("theme d", initialState, host).input).toBe("theme dark ");
    });

    it("leaves the input alone when nothing matches or in vim", () => {
      expect(complete("cat nope", initialState, host)).toEqual({ input: "cat nope", options: [] });
      const vim: TerminalState = { ...initialState, mode: "vim" };
      expect(complete("gr", vim, host)).toEqual({ input: "gr", options: [] });
    });
  });
});

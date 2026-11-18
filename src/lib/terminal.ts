// The site's terminal: a small read-only shell over the posts and projects.
// Everything here is pure. A command returns what to print and what it wants
// done (navigate, restyle, close); the component carries those out.
import { siteConfig } from "#/site.config";
import { formatDate, slugifyTag } from "#/lib/utils";
import type { Theme } from "#/lib/theme";

const copy = siteConfig.terminal;
const { routes } = siteConfig;

export interface TerminalPost {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  searchText: string;
}

export interface TerminalProject {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  links: { label: string; href: string }[];
}

export interface TerminalLine {
  kind: "input" | "out" | "muted" | "error";
  text: string;
  /** Makes the line a link: a site path, or a full URL for somewhere else. */
  href?: string;
  /** The prompt an input line was typed at. */
  prompt?: string;
  /** Text before a linked line that stays out of the link, such as an `ls -l` column. */
  lead?: string;
}

export interface TerminalState {
  /** Directory names below the home directory; empty is `~`. */
  cwd: string[];
  mode: "sh" | "vim";
  history: string[];
}

/** What the page tells the interpreter about itself. */
export interface TerminalHost {
  posts: TerminalPost[];
  projects: TerminalProject[];
  /** Styles on offer, in menu order. Fewer than two means there is no choice. */
  styles: { id: string; name: string; blurb: string }[];
  styleId: string;
  theme: Theme;
  /** Set when the current style has a single fixed look. */
  themeLock?: Theme;
  /** The Markdown of a post. */
  readPost: (slug: string) => Promise<string>;
  now?: () => Date;
  random?: () => number;
}

export interface TerminalResult {
  lines: TerminalLine[];
  state: TerminalState;
  /** Wipe the screen before printing `lines`. */
  clear?: boolean;
  exit?: boolean;
  /** A site path (it may carry a hash) for the page to go to. */
  navigate?: string;
  style?: string;
  theme?: Theme;
  gag?: "rm";
}

type Output = Partial<Omit<TerminalResult, "state">> & { cwd?: string[]; mode?: "sh" | "vim" };

interface Env {
  state: TerminalState;
  host: TerminalHost;
}

type Command = (args: string[], env: Env) => Output | Promise<Output>;

type Node =
  | { type: "dir"; path: string[] }
  | { type: "post"; post: TerminalPost }
  | { type: "project"; project: TerminalProject }
  | { type: "about" };

interface Entry {
  name: string;
  dir: boolean;
  href: string;
  /** The first column of `ls -l`: a date or a count. */
  detail: string;
}

const out = (text: string, href?: string): TerminalLine => ({ kind: "out", text, href });
const muted = (text: string): TerminalLine => ({ kind: "muted", text });
const error = (text: string): TerminalLine => ({ kind: "error", text });

export const initialState: TerminalState = { cwd: [], mode: "sh", history: [] };

export const welcomeLines: TerminalLine[] = copy.welcome.map(muted);

export function displayPath(cwd: string[]): string {
  return ["~", ...cwd].join("/");
}

export function promptOf(state: TerminalState): string {
  if (state.mode === "vim") return ":";
  return `${copy.user}@${siteConfig.name} ${displayPath(state.cwd)} $`;
}

/** The directory a page corresponds to, so the terminal opens where the reader is. */
export function cwdFromPath(pathname: string): string[] {
  const [section, name] = pathname.split("/").filter(Boolean);
  if (`/${section}` === routes.posts) return ["posts"];
  if (`/${section}` === routes.projects) return ["projects"];
  if (`/${section}` === routes.tags) return name ? ["tags", decodeURIComponent(name)] : ["tags"];
  return [];
}

function tokenize(input: string): string[] {
  return [...input.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(
    (match) => match[1] ?? match[2] ?? match[3],
  );
}

function resolvePath(path: string, cwd: string[]): string[] {
  const absolute = path.startsWith("~") || path.startsWith("/");
  const segments = absolute ? [] : [...cwd];
  for (const part of path.replace(/^~/, "").split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") segments.pop();
    else segments.push(part);
  }
  return segments;
}

const stem = (name: string) => name.replace(/\.md$/, "");

function tagsOf(posts: TerminalPost[]): Map<string, TerminalPost[]> {
  const tags = new Map<string, TerminalPost[]>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = slugifyTag(tag);
      if (!slug) continue;
      tags.set(slug, [...(tags.get(slug) ?? []), post]);
    }
  }
  return tags;
}

function lookup(segments: string[], host: TerminalHost): Node | null {
  const [top, second, third, ...rest] = segments;
  if (rest.length > 0) return null;
  if (top === undefined) return { type: "dir", path: [] };
  if (top === "about" || top === "about.md") return second === undefined ? { type: "about" } : null;
  if (top === "posts") {
    if (second === undefined) return { type: "dir", path: segments };
    const post = host.posts.find((item) => item.slug === stem(second));
    return post && third === undefined ? { type: "post", post } : null;
  }
  if (top === "projects") {
    if (second === undefined) return { type: "dir", path: segments };
    const project = host.projects.find((item) => item.slug === stem(second));
    return project && third === undefined ? { type: "project", project } : null;
  }
  if (top === "tags") {
    if (second === undefined) return { type: "dir", path: segments };
    const tagged = tagsOf(host.posts).get(second);
    if (!tagged) return null;
    if (third === undefined) return { type: "dir", path: segments };
    const post = tagged.find((item) => item.slug === stem(third));
    return post ? { type: "post", post } : null;
  }
  return null;
}

/** Finds what a typed path names. A bare post slug works from anywhere. */
function find(path: string, env: Env): Node | null {
  const node = lookup(resolvePath(path, env.state.cwd), env.host);
  if (node || path.includes("/")) return node;
  return lookup(["posts", path], env.host);
}

function hrefOf(node: Node): string {
  if (node.type === "about") return routes.about;
  if (node.type === "post") return `${routes.posts}/${node.post.slug}`;
  if (node.type === "project") return `${routes.projects}#${node.project.slug}`;
  const [top, tag] = node.path;
  if (top === "posts") return routes.posts;
  if (top === "projects") return routes.projects;
  if (top === "tags") return tag ? `${routes.tags}/${tag}` : routes.tags;
  return routes.home;
}

const postEntry = (post: TerminalPost): Entry => ({
  name: `${post.slug}.md`,
  dir: false,
  href: hrefOf({ type: "post", post }),
  detail: formatDate(post.date),
});

function entriesOf(path: string[], host: TerminalHost): Entry[] {
  const [top, tag] = path;
  if (top === "posts") return host.posts.map(postEntry);
  if (top === "projects")
    return host.projects.map((project) => ({
      name: `${project.slug}.md`,
      dir: false,
      href: hrefOf({ type: "project", project }),
      detail: project.tags[0] ?? "",
    }));
  if (top === "tags" && tag) return (tagsOf(host.posts).get(tag) ?? []).map(postEntry);
  if (top === "tags")
    return [...tagsOf(host.posts)]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, posts]) => ({
        name: slug,
        dir: true,
        href: `${routes.tags}/${slug}`,
        detail: String(posts.length),
      }));
  return [
    { name: "about.md", dir: false, href: routes.about, detail: "" },
    { name: "posts", dir: true, href: routes.posts, detail: String(host.posts.length) },
    { name: "projects", dir: true, href: routes.projects, detail: String(host.projects.length) },
    { name: "tags", dir: true, href: routes.tags, detail: String(tagsOf(host.posts).size) },
  ];
}

const label = (entry: Entry) => (entry.dir ? `${entry.name}/` : entry.name);

const usageOf = (name: string) =>
  error(copy.usage(copy.commands.find((command) => command.name === name)?.usage ?? name));

const manualName = siteConfig.name.split(".")[0];

function manualPage(): TerminalLine[] {
  const { manual } = copy;
  const { author } = siteConfig;
  return [
    out("NAME"),
    out(`    ${manual.name}`),
    out(""),
    out("SYNOPSIS"),
    out(`    ${manual.synopsis}`),
    out(""),
    out("DESCRIPTION"),
    ...manual.description.map((line) => out(`    ${line}`)),
    out(""),
    out("BUGS"),
    out(`    ${manual.bugs}`),
    out(""),
    out(manual.seeAlso.toUpperCase()),
    out(`    ${author.github}`, author.github),
    out(`    ${author.linkedin}`, author.linkedin),
    out(`    mailto:${author.email}`, `mailto:${author.email}`),
  ];
}

const readOnly =
  (name: string): Command =>
  () => ({ lines: [error(copy.readOnly(name))] });

const commands: Record<string, Command> = {
  help: () => {
    const width = Math.max(...copy.commands.map((command) => command.usage.length));
    return {
      lines: [
        out(copy.helpHeading),
        ...copy.commands.map((command) =>
          out(`  ${command.usage.padEnd(width)}  ${command.summary}`),
        ),
        muted(copy.helpFooter),
      ],
    };
  },

  ls: (args, env) => {
    const long = args.some((arg) => arg.startsWith("-") && arg.includes("l"));
    const targets = args.filter((arg) => !arg.startsWith("-"));
    const lines: TerminalLine[] = [];
    for (const target of targets.length > 0 ? targets : ["."]) {
      const node = find(target, env);
      if (!node) {
        lines.push(error(copy.noSuchFile("ls", target)));
      } else if (node.type === "dir") {
        const entries = entriesOf(node.path, env.host);
        const width = Math.max(0, ...entries.map((entry) => entry.detail.length));
        for (const entry of entries) {
          const line = out(label(entry), entry.href);
          lines.push(long ? { ...line, lead: `${entry.detail.padStart(width)}  ` } : line);
        }
      } else {
        lines.push(out(target, hrefOf(node)));
      }
    }
    return { lines };
  },

  cd: (args, env) => {
    const target = args[0] ?? "~";
    const node = lookup(resolvePath(target, env.state.cwd), env.host);
    if (!node) return { lines: [error(copy.noSuchFile("cd", target))] };
    if (node.type !== "dir") return { lines: [error(copy.notADirectory(target))] };
    return { lines: [], cwd: node.path, navigate: hrefOf(node) };
  },

  pwd: (_args, env) => ({ lines: [out(displayPath(env.state.cwd))] }),

  cat: async (args, env) => {
    if (args.length === 0) return { lines: [usageOf("cat")] };
    const lines: TerminalLine[] = [];
    for (const target of args) {
      const node = find(target, env);
      if (!node) {
        lines.push(error(copy.noSuchFile("cat", target)));
      } else if (node.type === "dir") {
        lines.push(error(copy.isADirectory(target)));
      } else if (node.type === "about") {
        lines.push(...copy.about.map((line) => out(line)), out(copy.aboutLink, routes.about));
      } else if (node.type === "project") {
        const { project } = node;
        lines.push(
          out(`# ${project.name}`),
          out(""),
          out(project.description),
          out(""),
          muted(project.tags.join(", ")),
          ...project.links.map((link) => out(`${link.label}: ${link.href}`, link.href)),
        );
      } else {
        try {
          const text = await env.host.readPost(node.post.slug);
          lines.push(
            ...text
              .trimEnd()
              .split("\n")
              .map((line) => out(line)),
          );
        } catch {
          lines.push(error(copy.readFailed(target)));
        }
      }
    }
    return { lines };
  },

  open: (args, env) => {
    const target = args[0] ?? ".";
    const node = find(target, env);
    if (!node) return { lines: [error(copy.noSuchFile("open", target))] };
    return { lines: [], navigate: hrefOf(node), exit: true };
  },

  grep: (args, env) => {
    const text = args
      .filter((arg) => !arg.startsWith("-"))
      .join(" ")
      .toLowerCase();
    if (!text) return { lines: [usageOf("grep")] };
    const matches = env.host.posts.filter((post) => post.searchText.includes(text));
    if (matches.length === 0) return { lines: [muted(copy.noMatches(text))] };
    return {
      lines: matches.map((post) =>
        out(`posts/${post.slug}.md: ${post.title}`, hrefOf({ type: "post", post })),
      ),
    };
  },

  style: (args, { host }) => {
    const { styles } = host;
    if (styles.length < 2) return { lines: [error(copy.styleLocked)] };
    const wanted = args[0]?.toLowerCase();
    if (!wanted) {
      const width = Math.max(...styles.map((style) => style.id.length));
      return {
        lines: [
          ...styles.map((style) =>
            out(
              `${style.id === host.styleId ? "*" : " "} ${style.id.padEnd(width)}  ${style.blurb}`,
            ),
          ),
          muted(copy.styleHint),
        ],
      };
    }
    const others = styles.filter((style) => style.id !== host.styleId);
    const random = host.random ?? Math.random;
    const next =
      wanted === "random"
        ? others[Math.floor(random() * others.length)]
        : styles.find((style) => style.id === wanted || style.name.toLowerCase() === wanted);
    if (!next) return { lines: [error(copy.styleUnknown(wanted)), muted(copy.styleHint)] };
    if (next.id === host.styleId) return { lines: [muted(copy.styleCurrent(next.name))] };
    return { lines: [out(copy.styleSwitching(next.name))], style: next.id };
  },

  theme: (args, { host }) => {
    const wanted = args[0]?.toLowerCase();
    if (wanted !== undefined && wanted !== "light" && wanted !== "dark")
      return { lines: [usageOf("theme")] };
    if (host.themeLock) {
      const style = host.styles.find((item) => item.id === host.styleId)?.name ?? host.styleId;
      return { lines: [error(copy.themeLocked(style, host.themeLock))] };
    }
    const next: Theme = wanted ?? (host.theme === "dark" ? "light" : "dark");
    if (next === host.theme) return { lines: [muted(copy.themeCurrent(next))] };
    return { lines: [out(copy.themeSet(next))], theme: next };
  },

  man: (args) => {
    const name = args[0];
    if (!name) return { lines: [error(copy.manMissing)] };
    if (name === manualName) return { lines: manualPage() };
    const command = copy.commands.find((item) => item.name === name);
    if (!command) return { lines: [error(copy.noManual(name))] };
    return { lines: [out(`${command.usage}`), out(`    ${command.summary}`)] };
  },

  whoami: () => ({ lines: [out(copy.user)] }),
  date: (_args, { host }) => ({
    lines: [out(formatDate((host.now?.() ?? new Date()).toISOString()))],
  }),
  echo: (args) => ({ lines: [out(args.join(" "))] }),
  history: (_args, { state }) => ({
    lines: state.history.map((entry, index) => out(`${String(index + 1).padStart(4)}  ${entry}`)),
  }),
  clear: () => ({ lines: [], clear: true }),
  exit: () => ({ lines: [], exit: true }),

  // Not in `help`: these are for whoever tries them.
  sudo: () => ({ lines: [error(copy.sudo)] }),
  rm: (args) => {
    const recursive = args.some((arg) => /^-\w*r/i.test(arg));
    const everything = args.some((arg) => ["/", "~", "*", ".", "/*", "~/*"].includes(arg));
    if (recursive && everything) return { lines: copy.rm.map((line) => out(line)), gag: "rm" };
    return { lines: [error(copy.readOnly("rm"))] };
  },
  touch: readOnly("touch"),
  mkdir: readOnly("mkdir"),
  mv: readOnly("mv"),
  cp: readOnly("cp"),
  chmod: readOnly("chmod"),
  vim: () => ({
    mode: "vim",
    clear: true,
    lines: [...Array.from({ length: 8 }, () => muted("~")), muted(copy.vim.status)],
  }),
  emacs: () => ({ lines: [error(copy.otherEditor("emacs"))] }),
  nano: () => ({ lines: [error(copy.otherEditor("nano"))] }),
};
commands.vi = commands.vim;
commands.nvim = commands.vim;

const vimQuits = new Set([":q", ":q!", ":wq", ":wq!", ":x", ":qa", ":qa!", "ZZ"]);

/** Runs one line of input. The typed line itself is not in the returned lines. */
export async function run(
  input: string,
  state: TerminalState,
  host: TerminalHost,
): Promise<TerminalResult> {
  const text = input.trim();
  if (!text) return { lines: [], state };

  if (state.mode === "vim") {
    if (vimQuits.has(text))
      return { lines: [muted(copy.vim.exit)], state: { ...state, mode: "sh" }, clear: true };
    return { lines: [error(copy.vim.unknown(text))], state };
  }

  const [name, ...args] = tokenize(text);
  const next: TerminalState = { ...state, history: [...state.history, text] };
  const command = Object.hasOwn(commands, name) ? commands[name] : undefined;
  if (!command) return { lines: [error(copy.notFound(name))], state: next };

  const { cwd, mode, lines = [], ...effects } = await command(args, { state: next, host });
  return {
    ...effects,
    lines,
    state: { ...next, cwd: cwd ?? next.cwd, mode: mode ?? next.mode },
  };
}

function commonPrefix(values: string[]): string {
  let prefix = values[0] ?? "";
  for (const value of values) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

/**
 * Tab completion. Returns the input with as much filled in as is unambiguous,
 * and the candidates to show when nothing more could be filled in.
 */
export function complete(
  input: string,
  state: TerminalState,
  host: TerminalHost,
): { input: string; options: string[] } {
  if (state.mode === "vim") return { input, options: [] };
  const cut = input.lastIndexOf(" ") + 1;
  const head = input.slice(0, cut);
  const word = input.slice(cut);
  const command = head.trim().split(/\s+/)[0];

  let candidates: string[];
  if (cut === 0) {
    candidates = copy.commands.map((item) => item.name);
  } else if (command === "style") {
    candidates = [...host.styles.map((style) => style.id), "random"];
  } else if (command === "theme") {
    candidates = ["light", "dark"];
  } else if (command === "man") {
    candidates = [manualName, ...copy.commands.map((item) => item.name)];
  } else {
    const slash = word.lastIndexOf("/") + 1;
    const base = word.slice(0, slash);
    const node = lookup(resolvePath(base || ".", state.cwd), host);
    const entries = node?.type === "dir" ? entriesOf(node.path, host) : [];
    candidates = entries
      .filter((entry) => entry.dir || command !== "cd")
      .map((entry) => base + label(entry));
  }

  const matches = candidates.filter((candidate) => candidate.startsWith(word));
  if (matches.length === 0) return { input, options: [] };
  if (matches.length === 1) {
    const only = matches[0];
    return { input: head + only + (only.endsWith("/") ? "" : " "), options: [] };
  }
  const prefix = commonPrefix(matches);
  return { input: head + prefix, options: prefix === word ? matches : [] };
}

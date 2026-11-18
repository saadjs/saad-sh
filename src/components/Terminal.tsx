import { useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { siteConfig } from "#/site.config";
import { projects, projectSlug } from "#/lib/projects";
import {
  complete,
  cwdFromPath,
  displayPath,
  initialState,
  promptOf,
  run,
  welcomeLines,
  type TerminalHost,
  type TerminalLine,
  type TerminalPost,
  type TerminalState,
} from "#/lib/terminal";
import { toggleTheme, type Theme } from "#/lib/theme";
import { styleConfig, styles } from "#/styles";
import { chooseStyle } from "#/styles/choose";
import { useStyle } from "#/styles/use-style";

const copy = siteConfig.terminal;

/** Holds the screen across the reload that a style change needs. */
export const terminalResumeKey = "terminal:resume";

// Long posts add up; the oldest lines scroll away for good past this.
const SCREEN_LIMIT = 600;
const GAG_MS = 2600;

type ScreenLine = TerminalLine & { id: number };

interface Saved {
  lines: ScreenLine[];
  state: TerminalState;
}

function readSaved(): Saved | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(terminalResumeKey) ?? "null") as Saved | null;
    return saved && Array.isArray(saved.lines) && Array.isArray(saved.state?.history)
      ? saved
      : null;
  } catch {
    return null;
  }
}

const projectFiles = projects.map((project) => ({
  slug: projectSlug(project.name),
  name: project.name,
  description: project.description,
  tags: project.tags,
  links: project.links,
}));

const styleChoices = styleConfig.picker
  ? styles.map(({ id, name, blurb }) => ({ id, name, blurb }))
  : [];

async function fetchPosts(): Promise<TerminalPost[]> {
  const response = await fetch("/search-index.json");
  if (!response.ok) throw new Error("Search index request failed");
  const data = (await response.json()) as { posts?: TerminalPost[] } | TerminalPost[];
  return Array.isArray(data) ? data : (data.posts ?? []);
}

async function readPost(slug: string): Promise<string> {
  const response = await fetch(`${siteConfig.routes.posts}/${slug}.md`);
  if (!response.ok) throw new Error("Post request failed");
  return response.text();
}

const currentTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export function Terminal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const style = useStyle();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const postsRef = useRef<Promise<TerminalPost[]> | null>(null);
  const nextId = useRef(0);

  const [saved] = useState(readSaved);
  const [lines, setLines] = useState<ScreenLine[]>(
    () => saved?.lines ?? welcomeLines.map((line, id) => ({ ...line, id })),
  );
  const [state, setState] = useState<TerminalState>(saved?.state ?? initialState);
  const [posts, setPosts] = useState<TerminalPost[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // Position in the history while walking it with the arrow keys.
  const [recall, setRecall] = useState<number | null>(null);
  // A resumed screen keeps the directory it was left in.
  const [wasOpen, setWasOpen] = useState(saved !== null);

  // Opening the terminal puts it in the directory of the page behind it.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && state.mode === "sh") setState({ ...state, cwd: cwdFromPath(pathname) });
  }

  const loadPosts = () => {
    postsRef.current ??= fetchPosts().then(
      (loaded) => {
        setPosts(loaded);
        return loaded;
      },
      (error: unknown) => {
        // Let the next command try again.
        postsRef.current = null;
        throw error;
      },
    );
    return postsRef.current;
  };

  useEffect(() => {
    try {
      sessionStorage.removeItem(terminalResumeKey);
    } catch {
      // Storage can be blocked; there is nothing to clear.
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
      inputRef.current?.focus();
      loadPosts().catch(() => {});
    } else {
      dialog.close();
    }
    return () => dialog.close();
  }, [open]);

  useEffect(() => {
    const screen = screenRef.current;
    if (screen) screen.scrollTop = screen.scrollHeight;
  }, [lines, open]);

  const host = useMemo(
    (): Omit<TerminalHost, "theme"> => ({
      posts,
      projects: projectFiles,
      styles: styleChoices,
      styleId: style.id,
      themeLock: style.themes === "both" ? undefined : style.themes,
      readPost,
    }),
    [posts, style],
  );

  const stamp = (fresh: TerminalLine[]): ScreenLine[] => {
    nextId.current = Math.max(nextId.current, (lines.at(-1)?.id ?? -1) + 1);
    return fresh.map((line) => ({ ...line, id: nextId.current++ }));
  };

  const goTo = (href: string) => {
    void router.navigate({ href });
  };

  const submit = async () => {
    if (busy) return;
    const typed = input;
    const echo: TerminalLine = { kind: "input", prompt: promptOf(state), text: typed };
    setInput("");
    setRecall(null);
    setBusy(true);

    const notes: TerminalLine[] = [];
    let loaded = posts;
    try {
      loaded = await loadPosts();
    } catch {
      notes.push({ kind: "error", text: copy.loadError });
    }
    let result: Awaited<ReturnType<typeof run>>;
    try {
      result = await run(typed, state, { ...host, posts: loaded, theme: currentTheme() });
    } catch {
      // A failing command must not leave the prompt locked.
      setLines([...lines, ...stamp([echo, { kind: "error", text: copy.readFailed(typed) }])]);
      setBusy(false);
      return;
    }

    const printed = stamp(result.clear ? result.lines : [echo, ...notes, ...result.lines]);
    const screen = (result.clear ? printed : [...lines, ...printed]).slice(-SCREEN_LIMIT);
    setLines(screen);
    setState(result.state);
    setBusy(false);

    if (result.theme && result.theme !== currentTheme()) toggleTheme();
    if (result.gag) {
      const root = document.documentElement;
      root.dataset.terminalGag = result.gag;
      window.setTimeout(() => delete root.dataset.terminalGag, GAG_MS);
    }
    if (result.navigate) goTo(result.navigate);
    if (result.exit) onClose();
    if (result.style) {
      try {
        const keep: Saved = { lines: screen, state: result.state };
        sessionStorage.setItem(terminalResumeKey, JSON.stringify(keep));
      } catch {
        // Storage can be blocked; the style still changes, the screen just starts over.
      }
      chooseStyle(result.style);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (busy) return;
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
      return;
    }
    // The key that opens the terminal also puts it away, as long as nothing is typed.
    if (event.key === "`" && input === "") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "Tab" && !event.shiftKey && input !== "") {
      event.preventDefault();
      const completed = complete(input, state, { ...host, theme: currentTheme() });
      setInput(completed.input);
      if (completed.options.length > 0) {
        const shown = stamp([
          { kind: "input", prompt: promptOf(state), text: input },
          { kind: "muted", text: completed.options.join("  ") },
        ]);
        setLines([...lines, ...shown].slice(-SCREEN_LIMIT));
      }
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const { history } = state;
      if (history.length === 0) return;
      event.preventDefault();
      const from = recall ?? history.length;
      const to = Math.min(history.length, Math.max(0, from + (event.key === "ArrowUp" ? -1 : 1)));
      setRecall(to === history.length ? null : to);
      setInput(history[to] ?? "");
    }
  };

  const followLink = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    goTo(href);
    onClose();
  };

  return (
    // Native dialogs handle Escape (via cancel); backdrop clicks are handled here.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <dialog
      ref={dialogRef}
      aria-label={copy.label}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent px-4 py-6 text-foreground backdrop:bg-foreground/20 open:flex open:items-start open:justify-center sm:py-[8vh]"
    >
      <div className="terminal ui-popover">
        <div className="terminal-bar">
          <span className="terminal-title">
            {copy.user}@{siteConfig.name}: {displayPath(state.cwd)}
          </span>
          <button type="button" onClick={onClose} className="terminal-close">
            {copy.close}
          </button>
        </div>
        {/* A click anywhere on the screen lands in the prompt, as in a real terminal;
            the input itself is what keyboard and screen-reader users reach. */}
        {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          ref={screenRef}
          className="terminal-screen"
          onClick={() => {
            // Leave a text selection alone so output can be copied.
            if (window.getSelection()?.isCollapsed !== false) inputRef.current?.focus();
          }}
        >
          <div role="log" aria-label={copy.outputLabel}>
            {lines.map((line) => (
              <div key={line.id} className="terminal-line" data-kind={line.kind}>
                {line.prompt && <span className="terminal-prompt">{line.prompt} </span>}
                {line.lead}
                {line.href === undefined ? (
                  line.text
                ) : /^[a-z]+:/.test(line.href) ? (
                  <a href={line.href} target="_blank" rel="noreferrer">
                    {line.text}
                  </a>
                ) : (
                  <a href={line.href} onClick={(event) => followLink(event, line.href ?? "")}>
                    {line.text}
                  </a>
                )}
              </div>
            ))}
          </div>
          <div className="terminal-entry">
            <span className="terminal-prompt" aria-hidden="true">
              {state.mode === "sh" ? (
                <>
                  <span className="terminal-prompt-host">
                    {copy.user}@{siteConfig.name}{" "}
                  </span>
                  {displayPath(state.cwd)} $
                </>
              ) : (
                promptOf(state)
              )}
            </span>
            <input
              ref={inputRef}
              value={input}
              readOnly={busy}
              onChange={(event) => {
                setInput(event.target.value);
                setRecall(null);
              }}
              onKeyDown={handleKeyDown}
              className="terminal-input"
              aria-label={copy.inputLabel}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
            />
          </div>
        </div>
      </div>
    </dialog>
  );
}

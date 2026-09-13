import { useClipboard } from "#/hooks/useClipboard";
import { loadPostMarkdown } from "#/lib/post-markdown";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CheckIcon } from "#/components/icons/CheckIcon";
import { ChevronDownIcon } from "#/components/icons/ChevronDownIcon";
import { ChatGPTIcon } from "#/components/icons/ChatGPTIcon";
import { ClaudeIcon } from "#/components/icons/ClaudeIcon";
import { CopyIcon } from "#/components/icons/CopyIcon";
import { MarkdownIcon } from "#/components/icons/MarkdownIcon";

interface ShareMenuProps {
  slug: string;
  markdownUrl: string;
}

export function ShareMenu({ slug, markdownUrl }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const { status, copy } = useClipboard();
  const copied = status === "copied";
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const markdownRef = useRef<Promise<string> | undefined>(undefined);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setOpen(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = () => {
    void copy(() => {
      markdownRef.current ??= loadPostMarkdown({ data: slug }).catch((error) => {
        markdownRef.current = undefined;
        throw error;
      });
      return markdownRef.current;
    });
  };

  const openInLLM = useCallback(
    (baseUrl: string, paramKey: string) => {
      const prompt = `I'm looking at this blog post: ${markdownUrl}\nHelp me understand it. Be ready to explain concepts, give examples, or help debug based on it.\n`;
      const params = new URLSearchParams({ [paramKey]: prompt });
      window.open(`${baseUrl}?${params.toString()}`, "_blank");
    },
    [markdownUrl],
  );

  const btnBase =
    "font-mono text-xs uppercase tracking-[0.14em] text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";
  const btnBorder =
    "border border-zinc-200/80 bg-white/80 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-zinc-700";

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 rounded-l-full py-2 pr-3 pl-4 ${btnBase} ${btnBorder} border-r-0`}
      >
        {copied ? (
          <CheckIcon className="h-4 w-4 text-green-500" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )}
        {copied ? "Copied!" : status === "copying" ? "Copying…" : "Copy Page"}
      </button>
      <button
        type="button"
        ref={triggerRef}
        aria-label="Share this post"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center rounded-r-full py-2 pr-3 pl-2 ${btnBase} ${btnBorder}`}
      >
        <ChevronDownIcon className="h-3 w-3" />
      </button>

      {status === "error" && (
        <p role="alert" className="absolute top-full right-0 mt-2 w-64 text-sm text-red-500">
          Could not copy. Try again or use View as Markdown.
        </p>
      )}
      {open && (
        <div
          id={menuId}
          className="absolute top-full right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-200/80 bg-white/95 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95"
        >
          <button
            type="button"
            onClick={() => openInLLM("https://chatgpt.com", "prompt")}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ChatGPTIcon className="h-4 w-4 shrink-0" />
            Open in ChatGPT
          </button>
          <button
            type="button"
            onClick={() => openInLLM("https://claude.ai/new", "q")}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ClaudeIcon className="h-4 w-4 shrink-0" />
            Open in Claude
          </button>
          <a
            href={markdownUrl}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <MarkdownIcon className="h-4 w-4 shrink-0" />
            View as Markdown
          </a>
        </div>
      )}
    </div>
  );
}

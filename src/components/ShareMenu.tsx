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

  const itemClass =
    "flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-border/50 hover:text-foreground";

  return (
    <div ref={menuRef} className="relative ml-auto inline-flex items-center">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 py-1 transition-colors hover:text-foreground"
      >
        {copied ? (
          <CheckIcon className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <CopyIcon className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : status === "copying" ? "Copying…" : "Copy page"}
      </button>
      <button
        type="button"
        ref={triggerRef}
        aria-label="Share this post"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="ml-1 inline-flex items-center p-1 transition-colors hover:text-foreground"
      >
        <ChevronDownIcon className="h-3 w-3" />
      </button>

      {status === "error" && (
        <p
          role="alert"
          className="absolute top-full right-0 mt-2 w-64 font-sans text-sm text-red-500"
        >
          Could not copy. Try again or use View as Markdown.
        </p>
      )}
      {open && (
        <div
          id={menuId}
          className="absolute top-full right-0 z-50 mt-2 w-52 overflow-hidden rounded-md border border-border bg-background py-1 font-sans shadow-sm"
        >
          <button
            type="button"
            onClick={() => openInLLM("https://chatgpt.com", "prompt")}
            className={itemClass}
          >
            <ChatGPTIcon className="h-4 w-4 shrink-0" />
            Open in ChatGPT
          </button>
          <button
            type="button"
            onClick={() => openInLLM("https://claude.ai/new", "q")}
            className={itemClass}
          >
            <ClaudeIcon className="h-4 w-4 shrink-0" />
            Open in Claude
          </button>
          <a href={markdownUrl} className={itemClass}>
            <MarkdownIcon className="h-4 w-4 shrink-0" />
            View as Markdown
          </a>
        </div>
      )}
    </div>
  );
}

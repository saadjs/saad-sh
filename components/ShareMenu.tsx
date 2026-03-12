"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { ChatGPTIcon } from "@/components/icons/ChatGPTIcon";
import { ClaudeIcon } from "@/components/icons/ClaudeIcon";
import { CopyIcon } from "@/components/icons/CopyIcon";

interface ShareMenuProps {
  markdown: string;
  url: string;
}

export function ShareMenu({ markdown, url }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1500);
    });
  }, [markdown]);

  const openInLLM = useCallback(
    (baseUrl: string, paramKey: string) => {
      const prompt = `I'm looking at this blog post: ${url}\nHelp me understand it. Be ready to explain concepts, give examples, or help debug based on it.\n`;
      const params = new URLSearchParams({ [paramKey]: prompt });
      window.open(`${baseUrl}?${params.toString()}`, "_blank");
    },
    [url],
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
        {copied ? "Copied!" : "Copy Page"}
      </button>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center rounded-r-full py-2 pr-3 pl-2 ${btnBase} ${btnBorder}`}
      >
        <ChevronDownIcon className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-200/80 bg-white/95 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
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
        </div>
      )}
    </div>
  );
}

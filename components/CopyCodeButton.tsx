"use client";

import { useCallback, useRef, useState } from "react";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { CopyIcon } from "@/components/icons/CopyIcon";

export function CodeBlock({ children, className, ...props }: React.ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const code = preRef.current?.querySelector("code")?.textContent ?? "";
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div className="group relative my-6">
      <pre
        ref={preRef}
        {...props}
        className={`overflow-x-auto rounded-lg bg-zinc-100 p-4 font-mono text-sm dark:bg-zinc-800 [&_code]:bg-transparent [&_code]:p-0 ${className ?? ""}`.trim()}
      >
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-white/80 text-zinc-500 opacity-0 backdrop-blur-sm transition-all hover:text-zinc-900 group-hover:opacity-100 dark:bg-zinc-700/80 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}

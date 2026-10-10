import { useClipboard } from "#/hooks/useClipboard";
import { useCallback, useRef, useState } from "react";

const actionClass =
  "inline-flex min-h-11 items-center px-2.5 text-foreground transition-colors hover:text-accent";

export function CodeBlock({ children, className, ...props }: React.ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const { status, copy } = useClipboard();
  const copied = status === "copied";
  const [wrapped, setWrapped] = useState(false);
  const language = className?.match(/language-([\w-]+)/)?.[1] ?? "";

  const handleCopy = () => {
    void copy(() => preRef.current?.querySelector("code")?.textContent ?? "");
  };

  const handleWrapToggle = useCallback(() => {
    setWrapped((prev) => !prev);
  }, []);

  return (
    <div className="my-7">
      <div className="sketch-box overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b-[1.4px] border-dashed border-border pr-2 pl-[1.125rem] font-mono text-xs text-muted">
          <span>{language}</span>
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleWrapToggle}
              aria-pressed={wrapped}
              aria-label="Wrap lines"
              className={`${actionClass} ${wrapped ? "text-accent" : ""}`.trim()}
            >
              wrap
            </button>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy code"}
              className={actionClass}
            >
              {copied ? "copied" : "copy"}
            </button>
          </div>
        </div>
        <pre
          ref={preRef}
          {...props}
          className={`overflow-x-auto px-[1.125rem] py-4 font-mono text-[0.875rem] text-[var(--code-fg)] [&_code]:bg-transparent [&_code]:p-0 ${
            wrapped ? "[&_code]:whitespace-pre-wrap [&_code]:break-all" : ""
          } ${className ?? ""}`.trim()}
        >
          {children}
        </pre>
      </div>
      {status === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-500">
          Could not copy. Select the code and copy it manually, or try again.
        </p>
      )}
    </div>
  );
}

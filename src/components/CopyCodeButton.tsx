import { useClipboard } from "#/hooks/useClipboard";
import { useCallback, useRef, useState } from "react";

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
    <div>
      <div className="code-block ui-panel">
        <div className="code-block-bar">
          <span>{language}</span>
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleWrapToggle}
              aria-pressed={wrapped}
              aria-label="Wrap lines"
            >
              wrap
            </button>
            <button type="button" onClick={handleCopy} aria-label={copied ? "Copied" : "Copy code"}>
              {copied ? "copied" : "copy"}
            </button>
          </div>
        </div>
        <pre
          ref={preRef}
          {...props}
          className={`${
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

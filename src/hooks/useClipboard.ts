import { useCallback, useEffect, useRef, useState } from "react";

type CopyStatus = "idle" | "copying" | "copied" | "error";

export function useClipboard() {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const request = useRef(0);

  useEffect(
    () => () => {
      request.current++;
      clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async (getText: () => string | Promise<string>) => {
    const current = ++request.current;
    clearTimeout(timer.current);
    setStatus("copying");
    try {
      const text = getText();
      if (typeof text === "string") {
        await navigator.clipboard.writeText(text);
      } else if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
        // Start the clipboard operation during the gesture, before fetching the
        // text. Safari requires that activation even when the data is async.
        const blob = text.then((value) => new Blob([value], { type: "text/plain" }));
        // A denied clipboard may reject before it consumes the pending data.
        void blob.catch(() => {});
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      } else {
        await navigator.clipboard.writeText(await text);
      }
      if (request.current !== current) return false;
      setStatus("copied");
      timer.current = setTimeout(() => setStatus("idle"), 2000);
      return true;
    } catch {
      if (request.current === current) setStatus("error");
      return false;
    }
  }, []);

  return { status, copy };
}

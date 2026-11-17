import { useEffect, useId, useRef, useState } from "react";

const SAMPLE = [
  "The quick brown fox jumps over the lazy dog.",
  "hello balloon coffee mississippi",
  "Room 204, 16 Nov 2026",
].join("\n");

export default function FontTesterDemo() {
  const [size, setSize] = useState(40);
  const sizeId = useId();
  const sheet = useRef<HTMLTextAreaElement>(null);

  // The sheet grows with its text instead of scrolling. Browsers with
  // field-sizing do this in CSS; this covers the rest.
  function fit() {
    const el = sheet.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    fit();
    // Line breaks move once the handwriting face replaces the fallback.
    void document.fonts.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [size]);

  return (
    <figure className="post-demo" aria-label="Type in my handwriting">
      <label className="demo-size" htmlFor={sizeId}>
        Size
        <input
          id={sizeId}
          className="demo-range"
          type="range"
          min={16}
          max={96}
          value={size}
          onChange={(event) => setSize(Number(event.target.value))}
        />
      </label>
      <textarea
        ref={sheet}
        className="demo-font-sheet"
        style={{ fontSize: size }}
        defaultValue={SAMPLE}
        onInput={fit}
        rows={3}
        spellCheck={false}
        aria-label="Text in the handwriting font"
      />
    </figure>
  );
}

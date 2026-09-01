import { useCallback, useEffect, useState } from "react";
import { siteConfig } from "#/site.config";

interface TocItem {
  id: string;
  text: string;
  depth: number;
}

const HEADING_SELECTOR = "h2[id], h3[id]";
const ACTIVE_OFFSET_PX = 120;

function readHeadings(root: HTMLElement): TocItem[] {
  const headings = Array.from(root.querySelectorAll<HTMLElement>(HEADING_SELECTOR));
  const levels = headings.map((el) => Number(el.tagName.slice(1)));
  const topLevel = levels.length > 0 ? Math.min(...levels) : 2;

  return headings
    .map((el, index) => {
      // The autolink "#" anchor is part of the heading; drop it from the label.
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelector(".heading-anchor")?.remove();
      return {
        id: el.id,
        text: (clone.textContent ?? "").trim(),
        depth: Math.min(levels[index] - topLevel, 1),
      };
    })
    .filter((item) => item.id && item.text);
}

function sameHeadings(a: TocItem[], b: TocItem[]): boolean {
  return (
    a.length === b.length && a.every((item, i) => item.id === b[i].id && item.text === b[i].text)
  );
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLElement | null>;
}

export function TableOfContents({ contentRef }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  // MDX content is lazy-loaded, so watch the container until headings show up.
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const sync = () => {
      const next = readHeadings(root);
      setItems((prev) => (sameHeadings(prev, next) ? prev : next));
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [contentRef]);

  useEffect(() => {
    if (items.length === 0) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
      if (atBottom) {
        setActiveId(items[items.length - 1].id);
        return;
      }
      let current = "";
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET_PX) current = item.id;
      }
      setActiveId(current);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
    setActiveId(id);
    event.currentTarget.closest("details")?.removeAttribute("open");
  }, []);

  if (items.length < 2) return null;

  const list = (
    <ul className="space-y-1 border-l border-border">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${encodeURIComponent(item.id)}`}
            onClick={(event) => handleClick(event, item.id)}
            aria-current={activeId === item.id ? "location" : undefined}
            className={`-ml-px block border-l-2 py-1 text-sm leading-snug transition-colors ${
              item.depth > 0 ? "pl-7" : "pl-4"
            } ${
              activeId === item.id
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:border-border hover:text-foreground"
            }`}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <nav aria-label={siteConfig.postPage.tocLabel} className="toc-rail">
        <p className="mb-3 text-xs font-medium tracking-wide text-faint uppercase">
          {siteConfig.postPage.tocLabel}
        </p>
        {list}
      </nav>
      <details className="toc-inline rounded-lg border border-border px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-muted marker:text-faint">
          {siteConfig.postPage.tocLabel}
        </summary>
        <div className="mt-3">{list}</div>
      </details>
    </>
  );
}

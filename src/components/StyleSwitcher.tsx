import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { siteConfig } from "#/site.config";
import { styleConfig, styleIds, styles } from "#/styles";
import { randomOther, styleCookie, styleCookieMaxAge } from "#/styles/resolve";
import { useStyle } from "#/styles/use-style";

const { styleMenu } = siteConfig;

// The server reads this cookie to render the page in the chosen style, so a
// reload is the whole switch: no flash, and only one style's CSS is ever loaded.
function choose(id: string) {
  document.cookie = `${styleCookie}=${id}; path=/; max-age=${styleCookieMaxAge}; samesite=lax`;
  // A `?style=` preview in the URL would override the choice just saved.
  const url = new URL(window.location.href);
  if (url.searchParams.has("style")) {
    url.searchParams.delete("style");
    window.location.replace(url);
  } else {
    window.location.reload();
  }
}

export function StyleSwitcher() {
  const current = useStyle();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  // The menu stays anchored to its button (styles may re-anchor it in CSS), but a
  // wrapped or narrow header can put the button near either edge, so slide the
  // menu sideways just enough to keep it on screen.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!open || !menu) return;
    const fit = () => {
      menu.style.translate = "";
      menu.style.maxHeight = "";
      const gutter = 16;
      const { left, right, top, bottom } = menu.getBoundingClientRect();
      const viewport = document.documentElement.clientWidth;
      let shift = 0;
      if (right > viewport - gutter) shift = viewport - gutter - right;
      if (left + shift < gutter) shift = gutter - left;
      if (shift !== 0) menu.style.translate = `${shift}px 0`;
      // The menu scrolls inside itself, so trim it to the room below the button.
      const room = window.innerHeight - gutter - top;
      if (bottom > window.innerHeight - gutter && room >= 160) menu.style.maxHeight = `${room}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!styleConfig.picker || styles.length < 2) return null;

  return (
    <div ref={rootRef} className="style-switcher">
      <button
        type="button"
        ref={triggerRef}
        aria-expanded={open}
        aria-controls={menuId}
        title={styleMenu.buttonTitle(current.name)}
        onClick={() => setOpen((value) => !value)}
      >
        {styleMenu.button}
      </button>
      {open && (
        <ul
          ref={menuRef}
          id={menuId}
          aria-label={styleMenu.listLabel}
          className="style-menu ui-popover"
        >
          {/* Random comes first so it is never below the fold of a scrolling menu. */}
          <li>
            <button type="button" onClick={() => choose(randomOther(styleIds, current.id))}>
              <span className="style-menu-swatch" aria-hidden="true">
                <span style={{ background: "var(--accent)" }} />
                <span style={{ background: "var(--foreground)" }} />
                <span style={{ background: "var(--background)" }} />
              </span>
              <span>
                {styleMenu.random}
                <span className="style-menu-blurb">{styleMenu.randomBlurb}</span>
              </span>
            </button>
          </li>
          {styles.map((style) => (
            <li key={style.id}>
              <button
                type="button"
                aria-current={style.id === current.id ? "true" : undefined}
                onClick={() => choose(style.id)}
              >
                <span className="style-menu-swatch" aria-hidden="true">
                  {style.swatch.map((color, index) => (
                    // oxlint-disable-next-line react/no-array-index-key
                    <span key={index} style={{ background: color }} />
                  ))}
                </span>
                <span>
                  {style.name}
                  <span className="style-menu-blurb">{style.blurb}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

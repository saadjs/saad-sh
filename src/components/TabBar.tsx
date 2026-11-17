import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isNavActive } from "#/lib/nav";
import { siteConfig } from "#/site.config";

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const icons: Record<string, React.ReactNode> = {
  [siteConfig.routes.home]: (
    <svg {...iconProps}>
      <path d="M4 10.6 12 4l8 6.6V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
    </svg>
  ),
  [siteConfig.routes.posts]: (
    <svg {...iconProps}>
      <path d="M5 5.5h14M5 10h14M5 14.5h9M5 19h6" />
    </svg>
  ),
  [siteConfig.routes.projects]: (
    <svg {...iconProps}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
    </svg>
  ),
  [siteConfig.routes.about]: (
    <svg {...iconProps}>
      <circle cx="12" cy="8.2" r="3.7" />
      <path d="M4.8 20c.9-3.6 3.7-5.4 7.2-5.4s6.3 1.8 7.2 5.4" />
    </svg>
  ),
};

const tabs = [{ label: siteConfig.tabBar.home, href: siteConfig.routes.home }, ...siteConfig.nav];

// Scrolling less than this in one direction is treated as jitter.
const SCROLL_SLOP = 12;

export interface ScrollState {
  /** Scroll position where the current direction was last confirmed. */
  anchor: number;
  /** The reader is moving down the page. */
  down: boolean;
}

/**
 * Follows the scroll direction. The bar always shows near the top of a page
 * and at its end, where the footer links live.
 */
export function trackScroll(
  state: ScrollState,
  y: number,
  viewportHeight: number,
  pageHeight: number,
): ScrollState {
  if (y < 64 || y + viewportHeight >= pageHeight - 48) return { anchor: y, down: false };
  if (y > state.anchor + SCROLL_SLOP) return { anchor: y, down: true };
  if (y < state.anchor - SCROLL_SLOP) return { anchor: y, down: false };
  return state;
}

// How long after a page settles scrolling is taken to be the browser putting
// the reader back where they were, not the reader moving.
const SETTLE_MS = 600;

/** True while the reader is scrolling down a page, so the bar can step aside. */
function useScrollingDown(pathname: string) {
  // The window restarts when the page finishes loading too: on a slow
  // connection the restored scroll position arrives long after the path changes.
  const loading = useRouterState({ select: (s) => s.isLoading });
  const [down, setDown] = useState(false);
  const [page, setPage] = useState(pathname);

  // A new page starts with the bar in view.
  if (page !== pathname) {
    setPage(pathname);
    setDown(false);
  }

  useEffect(() => {
    const settledAt = performance.now() + SETTLE_MS;
    let state: ScrollState = { anchor: window.scrollY, down: false };
    let frame = 0;
    // One reading per frame: the page height is a layout read.
    const update = () => {
      frame = 0;
      if (loading || performance.now() < settledAt) {
        state = { anchor: window.scrollY, down: false };
      } else {
        state = trackScroll(
          state,
          window.scrollY,
          window.innerHeight,
          document.documentElement.scrollHeight,
        );
      }
      setDown(state.down);
    };
    const onScroll = () => {
      frame ||= window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname, loading]);

  return down;
}

/**
 * The phone navigation: a bar of tabs fixed to the bottom edge. CSS shows it
 * only on narrow screens, where it replaces the links in the header.
 */
export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const scrollingDown = useScrollingDown(pathname);

  return (
    <nav
      aria-label={siteConfig.tabBar.label}
      className="site-tabbar"
      data-hidden={scrollingDown ? "true" : undefined}
    >
      {tabs.map((tab) => {
        const active = isNavActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            to={tab.href}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              // As in a phone app, the tab you are on takes you back to the top.
              if (pathname !== tab.href) return;
              event.preventDefault();
              const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
            }}
          >
            <span className="site-tabbar-icon">{icons[tab.href]}</span>
            <span className="site-tabbar-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

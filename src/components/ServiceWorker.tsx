import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Offline reading. Registers the worker (public/sw.js) in production only: in
 * development it would sit between the browser and the dev server's live
 * modules.
 */
export function ServiceWorker() {
  const href = useRouterState({ select: (s) => s.location.href });

  // Changing page in place fetches data, not a document, so the worker is
  // asked to keep the document for each page the visitor lands on.
  useEffect(() => {
    const workers = navigator.serviceWorker;
    if (!import.meta.env.PROD || !workers || !href) return;
    const save = () => {
      if (navigator.onLine) workers.controller?.postMessage({ type: "save-page", url: href });
    };
    save();
    // On a first visit the worker takes control after the page has loaded, so
    // the page being read is saved then.
    workers.addEventListener("controllerchange", save);
    return () => workers.removeEventListener("controllerchange", save);
  }, [href]);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline reading is an extra; the site works without it.
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    // The worker keeps whole pages, not the data the router fetches when it
    // changes page in place. Offline, links therefore load as documents, which
    // the worker can answer; stopping the event here keeps the router out.
    const loadAsDocument = (event: MouseEvent) => {
      if (navigator.onLine || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target || link.origin !== location.origin) {
        return;
      }
      event.stopPropagation();
    };
    window.addEventListener("click", loadAsDocument, { capture: true });

    return () => {
      window.removeEventListener("load", register);
      window.removeEventListener("click", loadAsDocument, { capture: true });
    };
  }, []);
  return null;
}

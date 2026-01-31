"use client";

import { useEffect } from "react";

function scrollToHash(hash: string) {
  if (!hash) return;
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
  target.scrollIntoView({ block: "start", behavior });
}

export function HashAnchor() {
  useEffect(() => {
    scrollToHash(window.location.hash);

    const onHashChange = () => scrollToHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}

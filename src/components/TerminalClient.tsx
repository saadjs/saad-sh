import { useCallback, useEffect, useRef, useState } from "react";
import type { Terminal as TerminalDialog } from "./Terminal";

export const terminalOpenEvent = "terminal:open";
export const terminalHash = "terminal";
// Mirrors `terminalResumeKey`; importing it would pull the terminal into every page.
const resumeKey = "terminal:resume";

/** Listens for the ways in, and only then downloads the terminal itself. */
export function TerminalClient() {
  const [Dialog, setDialog] = useState<typeof TerminalDialog | null>(null);
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Left in place, the hash would reopen the terminal on every reload.
    if (window.location.hash === `#${terminalHash}`) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    openerRef.current?.focus();
  }, []);

  useEffect(() => {
    const show = () => {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    };
    const shortcut = (event: KeyboardEvent) => {
      if (event.key !== "`" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      // Another dialog (search, or the terminal itself) already has the floor.
      if (typing || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      show();
    };
    window.addEventListener(terminalOpenEvent, show);
    window.addEventListener("keydown", shortcut);

    // A style change reloads the page mid-session, and `/#terminal` links here.
    let resuming = false;
    try {
      resuming = sessionStorage.getItem(resumeKey) !== null;
    } catch {
      // Storage can be blocked; the terminal simply stays closed.
    }
    if (resuming || window.location.hash === `#${terminalHash}`) show();

    return () => {
      window.removeEventListener(terminalOpenEvent, show);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);

  useEffect(() => {
    if (!open || Dialog) return;
    let active = true;
    import("./Terminal").then(
      (module) => {
        if (active) setDialog(() => module.Terminal);
      },
      () => {
        if (active) setOpen(false);
      },
    );
    return () => {
      active = false;
    };
  }, [open, Dialog]);

  return Dialog && <Dialog open={open} onClose={close} />;
}

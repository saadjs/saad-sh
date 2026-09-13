import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchCommand as SearchDialog } from "./SearchCommand";

export function SearchCommandClient() {
  const [Dialog, setDialog] = useState<typeof SearchDialog | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) openerRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const show = () => {
      if (open) return;
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setError(false);
      setOpen(true);
    };
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        show();
      }
      if (event.key === "Escape") close();
    };
    window.addEventListener("search:open", show);
    window.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("search:open", show);
      window.removeEventListener("keydown", shortcut);
    };
  }, [close, open]);

  useEffect(() => {
    if (!open || Dialog) return;
    let active = true;
    import("./SearchCommand").then(
      (module) => {
        if (active) setDialog(() => module.SearchCommand);
      },
      () => {
        if (active) {
          setError(true);
          setOpen(false);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [open, Dialog]);

  return (
    <>
      {Dialog && <Dialog open={open} onClose={close} />}
      {error && (
        <p role="alert" className="text-sm text-red-500">
          Search could not load. Open search to try again.
        </p>
      )}
    </>
  );
}

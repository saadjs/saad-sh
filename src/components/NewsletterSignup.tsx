import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { siteConfig } from "#/site.config";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          size?: "normal" | "flexible" | "compact";
          callback: (token: string) => void;
          "error-callback": () => void;
          "expired-callback": () => void;
          "timeout-callback": () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Module-level so the script tag survives remounts and is only injected once.
let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!turnstileScriptPromise) {
    turnstileScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Turnstile"));
      document.head.appendChild(script);
    }).catch((error) => {
      turnstileScriptPromise = null;
      throw error;
    });
  }
  return turnstileScriptPromise;
}

type Status = "idle" | "submitting" | "success" | "error";
type ErrorKind = "invalid_email" | "server" | null;

export function NewsletterSignup() {
  const { newsletter } = siteConfig;
  // const siteKey = import.meta.env.DEV ? "1x00000000000000000000AA" : newsletter.turnstileSiteKey;
  const siteKey = import.meta.env.DEV ? "3x00000000000000000000FF" : newsletter.turnstileSiteKey;

  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const widgetLoadingRef = useRef(false);

  const resetWidget = useCallback(() => {
    setTurnstileToken(null);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  const ensureWidget = useCallback(() => {
    if (widgetLoadingRef.current || widgetIdRef.current || !siteKey) return;
    widgetLoadingRef.current = true;
    loadTurnstileScript()
      .then(() => {
        if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          size: "flexible",
          callback: setTurnstileToken,
          "error-callback": resetWidget,
          "expired-callback": resetWidget,
          "timeout-callback": resetWidget,
        });
      })
      .catch(() => {
        // Allow a retry on the next focus or keystroke if the script failed.
        widgetLoadingRef.current = false;
        setTurnstileToken(null);
      });
  }, [resetWidget, siteKey]);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "submitting") return;

      const formElement = event.currentTarget;
      const website =
        (formElement.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
      const trimmedEmail = email.trim();

      if (!EMAIL_PATTERN.test(trimmedEmail)) {
        setStatus("error");
        setErrorKind("invalid_email");
        return;
      }

      // A valid Turnstile token is a prerequisite for submission. The button
      // is disabled until the success callback supplies one, but keep this
      // guard for programmatic form submissions.
      if (!turnstileToken) {
        ensureWidget();
        return;
      }

      setStatus("submitting");
      setErrorKind(null);

      // Consume immediately so a retry can't reuse a stale token.
      setTurnstileToken(null);

      try {
        const response = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, website, turnstileToken }),
        });
        const data = (await response.json()) as { ok: boolean; error?: string };

        if (response.ok && data.ok) {
          // The form (and the widget's container) unmounts on success, so tear
          // the widget down first rather than orphaning it.
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = null;
            widgetLoadingRef.current = false;
          }
          setStatus("success");
          return;
        }

        resetWidget();
        setStatus("error");
        setErrorKind(data.error === "invalid_email" ? "invalid_email" : "server");
      } catch {
        resetWidget();
        setStatus("error");
        setErrorKind("server");
      }
    },
    [email, ensureWidget, resetWidget, status, turnstileToken],
  );

  const isSubmitting = status === "submitting";
  const canSubmit = Boolean(turnstileToken) && !isSubmitting;
  const errorMessage =
    status === "error"
      ? errorKind === "invalid_email"
        ? newsletter.invalidEmailMessage
        : newsletter.errorMessage
      : "";

  const form = (
    <form onSubmit={handleSubmit} noValidate className="max-w-md">
      <label htmlFor={emailId} className="sr-only">
        Email address
      </label>
      {/* Honeypot: hidden from sighted users and assistive tech; real users never fill this in. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />
      <div className="flex flex-col gap-3">
        <input
          id={emailId}
          type="email"
          name="email"
          required
          value={email}
          onChange={(event) => {
            // Also load on first keystroke: someone who focused the field before
            // hydration finished never fired onFocus with a handler attached.
            ensureWidget();
            setEmail(event.target.value);
          }}
          onFocus={ensureWidget}
          placeholder={newsletter.emailPlaceholder}
          autoComplete="email"
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <div ref={containerRef} />
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex self-start items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? newsletter.submittingLabel : newsletter.buttonLabel}
        </button>
      </div>
      <p aria-live="polite" className="mt-2 min-h-[1.25rem] text-sm text-red-500 dark:text-red-400">
        {errorMessage}
      </p>
    </form>
  );

  const successBlock = (
    <p role="status" aria-live="polite" className="text-sm text-foreground">
      {newsletter.successMessage}
    </p>
  );

  // The surrounding page owns the eyebrow/heading/description copy.
  return status === "success" ? successBlock : form;
}

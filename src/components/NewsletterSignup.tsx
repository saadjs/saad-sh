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
const TOKEN_WAIT_TIMEOUT_MS = 4000;

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

function waitForToken(
  tokenRef: { current: string | null },
  timeoutMs: number,
): Promise<string | null> {
  if (tokenRef.current) return Promise.resolve(tokenRef.current);
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = window.setInterval(() => {
      if (tokenRef.current) {
        window.clearInterval(interval);
        resolve(tokenRef.current);
      } else if (Date.now() - start >= timeoutMs) {
        window.clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

type Status = "idle" | "submitting" | "success" | "error";
type ErrorKind = "invalid_email" | "server" | null;

export function NewsletterSignup() {
  const { newsletter } = siteConfig;
  const siteKey = import.meta.env.DEV ? "1x00000000000000000000AA" : newsletter.turnstileSiteKey;

  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const widgetLoadingRef = useRef(false);
  const tokenRef = useRef<string | null>(null);

  const ensureWidget = useCallback(() => {
    if (widgetLoadingRef.current || widgetIdRef.current || !siteKey) return;
    widgetLoadingRef.current = true;
    loadTurnstileScript()
      .then(() => {
        if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          size: "flexible",
          callback: (token) => {
            tokenRef.current = token;
          },
        });
      })
      .catch(() => {
        // Allow a retry on the next focus or keystroke if the script failed.
        widgetLoadingRef.current = false;
      });
  }, [siteKey]);

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

      setStatus("submitting");
      setErrorKind(null);

      let token = tokenRef.current;
      if (!token) {
        token = await waitForToken(tokenRef, TOKEN_WAIT_TIMEOUT_MS);
      }

      if (!token) {
        // Token was consumed by a previous submit, expired, or never arrived.
        // Reset the widget for the next attempt instead of hanging.
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
        setStatus("error");
        setErrorKind("server");
        return;
      }

      // Consume immediately so a retry can't reuse a stale token.
      tokenRef.current = null;

      try {
        const response = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, website, turnstileToken: token }),
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

        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
        setStatus("error");
        setErrorKind(data.error === "invalid_email" ? "invalid_email" : "server");
      } catch {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
        setStatus("error");
        setErrorKind("server");
      }
    },
    [email, status],
  );

  const isSubmitting = status === "submitting";
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
      <div className="flex flex-col gap-2 sm:flex-row">
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? newsletter.submittingLabel : newsletter.buttonLabel}
        </button>
      </div>
      <div ref={containerRef} className="mt-3" />
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

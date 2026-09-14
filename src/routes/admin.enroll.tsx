import { startRegistration } from "@simplewebauthn/browser";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/enroll")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [{ title: "Register a passkey" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: EnrollPage,
});

type Status = "idle" | "working" | "done" | "error";

function EnrollPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function register() {
    setStatus("working");
    setMessage("");

    try {
      const optionsResponse = await fetch("/admin/api/auth/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "enroll", token }),
      });
      if (!optionsResponse.ok) throw new Error("This enrollment link is not valid.");

      const attestation = await startRegistration({
        optionsJSON: await optionsResponse.json(),
      });

      const verifyResponse = await fetch("/admin/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "enroll",
          response: attestation,
          token,
          nickname: nickname.trim() || "passkey",
        }),
      });
      if (!verifyResponse.ok) throw new Error("That passkey could not be registered.");

      setStatus("done");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Registration was cancelled."
          : error instanceof Error
            ? error.message
            : "Something went wrong.",
      );
    }
  }

  if (status === "done") {
    return (
      <div className="mx-auto max-w-sm py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Passkey registered
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          That link is now spent. Register a second passkey on another device so losing one is not a
          lockout.
        </p>
        <button
          type="button"
          onClick={() => void navigate({ to: "/admin/login" })}
          className="mt-8 w-full rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Register a passkey</h1>
      <p className="mt-3 text-sm leading-6 text-muted">One-time link. Registering consumes it.</p>

      <label htmlFor="nickname" className="mt-8 block text-sm font-medium text-foreground">
        Name this passkey
      </label>
      <input
        id="nickname"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        placeholder="1Password"
        className="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
      />

      <button
        type="button"
        onClick={() => void register()}
        disabled={status === "working" || !token}
        className="mt-6 w-full rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "working" ? "Waiting for passkey…" : "Register passkey"}
      </button>

      {!token && (
        <p className="mt-4 text-sm text-muted">
          This link is missing its token. Generate a new one with{" "}
          <code className="rounded bg-border px-1.5 py-0.5 font-mono text-xs">
            pnpm admin:enroll
          </code>
          .
        </p>
      )}

      {status === "error" && (
        <p role="alert" className="mt-4 text-sm text-red-500">
          {message}
        </p>
      )}
    </div>
  );
}

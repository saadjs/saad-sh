import { startAuthentication } from "@simplewebauthn/browser";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Sign in" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: LoginPage,
});

type Status = "idle" | "working" | "error";

function LoginPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function signIn() {
    setStatus("working");
    setMessage("");

    try {
      const optionsResponse = await fetch("/admin/api/auth/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "login" }),
      });
      if (!optionsResponse.ok) throw new Error("Could not start sign-in.");

      const assertion = await startAuthentication({
        optionsJSON: await optionsResponse.json(),
      });

      const verifyResponse = await fetch("/admin/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "login", response: assertion }),
      });
      if (!verifyResponse.ok) throw new Error("That passkey was not accepted.");

      await navigate({ to: "/admin" });
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Sign-in was cancelled."
          : error instanceof Error
            ? error.message
            : "Something went wrong.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        This site is edited with a passkey. There is no password.
      </p>

      <button
        type="button"
        onClick={() => void signIn()}
        disabled={status === "working"}
        className="mt-8 w-full rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "working" ? "Waiting for passkey…" : "Continue with passkey"}
      </button>

      {status === "error" && (
        <p role="alert" className="mt-4 text-sm text-red-500">
          {message}
        </p>
      )}
    </div>
  );
}

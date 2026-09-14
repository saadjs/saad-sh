import { startRegistration } from "@simplewebauthn/browser";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{ title: "Settings · admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: SettingsPage,
});

type Credential = {
  id: string;
  nickname: string;
  createdAt: string;
  lastUsedAt: string | null;
};

function SettingsPage() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<Credential[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/admin/api/credentials");
    if (!response.ok) {
      setError("Could not load passkeys.");
      return;
    }
    const data = (await response.json()) as { credentials: Credential[] };
    setCredentials(data.credentials);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addPasskey() {
    const nickname = window.prompt("Name this passkey", "1Password");
    if (nickname === null) return;

    setBusy(true);
    setError("");
    try {
      const optionsResponse = await fetch("/admin/api/auth/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "add" }),
      });
      if (!optionsResponse.ok) throw new Error("Could not start registration.");

      const attestation = await startRegistration({
        optionsJSON: await optionsResponse.json(),
      });

      const verifyResponse = await fetch("/admin/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "add",
          response: attestation,
          nickname: nickname.trim() || "passkey",
        }),
      });
      if (!verifyResponse.ok) throw new Error("That passkey could not be registered.");

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error && caught.name === "NotAllowedError"
          ? "Registration was cancelled."
          : caught instanceof Error
            ? caught.message
            : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function revoke(credential: Credential) {
    if (!window.confirm(`Remove "${credential.nickname}"? It will stop working immediately.`)) {
      return;
    }

    const response = await fetch("/admin/api/credentials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: credential.id }),
    });

    if (response.status === 409) {
      setError("That is the only passkey left. Register another one first.");
      return;
    }
    if (!response.ok) {
      setError("Could not remove that passkey.");
      return;
    }
    await load();
  }

  return (
    <div className="py-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
      <button
        type="button"
        onClick={() => void navigate({ to: "/admin" })}
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Posts
      </button>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">Passkeys</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Keep at least two registered, on different devices. If every passkey is lost, recovery runs
        through{" "}
        <code className="rounded bg-border px-1.5 py-0.5 font-mono text-xs">pnpm admin:enroll</code>
        , which needs the Cloudflare account.
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-500">
          {error}
        </p>
      )}

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {credentials?.map((credential) => (
          <li key={credential.id} className="flex items-center justify-between gap-4 py-3">
            <span className="min-w-0">
              <span className="block truncate text-[0.95rem] text-foreground">
                {credential.nickname}
              </span>
              <span className="block text-xs text-faint">
                added {new Date(credential.createdAt).toLocaleDateString()}
                {credential.lastUsedAt
                  ? ` · last used ${new Date(credential.lastUsedAt).toLocaleDateString()}`
                  : " · never used"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => void revoke(credential)}
              className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs text-muted transition-colors hover:text-red-500"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {credentials !== null && credentials.length < 2 && (
        <p className="mt-4 text-sm text-accent">
          Only {credentials.length} passkey registered. Add another before you need it.
        </p>
      )}

      <button
        type="button"
        onClick={() => void addPasskey()}
        disabled={busy}
        className="mt-6 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Waiting for passkey…" : "Add a passkey"}
      </button>
    </div>
  );
}

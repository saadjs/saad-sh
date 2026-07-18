import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { useState } from "react";
import { getContact, upsertContact, verifyToken } from "#/lib/newsletter";
import { siteConfig } from "#/site.config";

const { confirmPage } = siteConfig.newsletter;

type ConfirmState =
  | { state: "invalid" }
  | { state: "expired" }
  | { state: "already-member" }
  | { state: "confirm"; email: string };

type ConfirmResult =
  | { state: "success" }
  | { state: "invalid" }
  | { state: "expired" }
  | { state: "error" };

// Read-only: verify the token and, if valid, look up membership. NO writes here
// so link scanners / prefetchers that hit the page on GET can't subscribe anyone.
const getConfirmState = createServerFn({ method: "GET" })
  .inputValidator((token: string) => token)
  .handler(async ({ data: token }): Promise<ConfirmState> => {
    const verified = await verifyToken(token, env.NEWSLETTER_SIGNING_SECRET);
    if (verified.status === "invalid") return { state: "invalid" };
    if (verified.status === "expired") return { state: "expired" };

    // A membership lookup failure must not break the page for someone who just
    // clicked a link in their inbox. Fall back to showing the confirm button:
    // confirming is idempotent, so an existing member simply re-confirms.
    try {
      const contact = await getContact(env.RESEND_AUDIENCE_ID, verified.email);
      if (contact && !contact.unsubscribed) return { state: "already-member" };
    } catch (error) {
      console.error("getConfirmState membership lookup failed", error);
    }
    return { state: "confirm", email: verified.email };
  });

// Write path: only invoked by an explicit button click (POST).
const confirmSubscription = createServerFn({ method: "POST" })
  .inputValidator((token: string) => token)
  .handler(async ({ data: token }): Promise<ConfirmResult> => {
    const verified = await verifyToken(token, env.NEWSLETTER_SIGNING_SECRET);
    if (verified.status === "invalid") return { state: "invalid" };
    if (verified.status === "expired") return { state: "expired" };

    try {
      await upsertContact(env.RESEND_AUDIENCE_ID, verified.email);
      return { state: "success" };
    } catch (error) {
      console.error("confirmSubscription failed", error);
      return { state: "error" };
    }
  });

export const Route = createFileRoute("/newsletter/confirm")({
  validateSearch: (search: Record<string, unknown>): { token: string } => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: ({ deps }) => getConfirmState({ data: deps.token }),
  head: () => ({
    meta: [
      { title: `${confirmPage.title} | ${siteConfig.name}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConfirmPage,
});

function Eyebrow() {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
      {siteConfig.newsletter.eyebrow}
    </p>
  );
}

function StatusPanel({
  heading,
  message,
  children,
}: {
  heading: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Eyebrow />
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{heading}</h1>
      <p className="max-w-lg text-muted leading-relaxed">{message}</p>
      {children}
    </div>
  );
}

function ConfirmForm({ email }: { email: string }) {
  const { token } = Route.useSearch();
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    setIsConfirming(true);
    try {
      setResult(await confirmSubscription({ data: token }));
    } catch (error) {
      console.error("confirmSubscription request failed", error);
      setResult({ state: "error" });
    } finally {
      setIsConfirming(false);
    }
  }

  if (result?.state === "success") {
    return (
      <StatusPanel heading={confirmPage.successHeading} message={confirmPage.successMessage} />
    );
  }
  if (result?.state === "invalid") {
    return (
      <StatusPanel heading={confirmPage.invalidHeading} message={confirmPage.invalidMessage} />
    );
  }
  if (result?.state === "expired") {
    return (
      <StatusPanel heading={confirmPage.expiredHeading} message={confirmPage.expiredMessage} />
    );
  }

  return (
    <StatusPanel heading={confirmPage.heading} message={confirmPage.description(email)}>
      {result?.state === "error" && (
        <p role="alert" className="text-sm text-foreground">
          {confirmPage.errorMessage}
        </p>
      )}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isConfirming}
        className="inline-flex shrink-0 items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isConfirming ? confirmPage.confirmingLabel : confirmPage.confirmButtonLabel}
      </button>
    </StatusPanel>
  );
}

function ConfirmPage() {
  const data = Route.useLoaderData();

  switch (data.state) {
    case "invalid":
      return (
        <StatusPanel heading={confirmPage.invalidHeading} message={confirmPage.invalidMessage} />
      );
    case "expired":
      return (
        <StatusPanel heading={confirmPage.expiredHeading} message={confirmPage.expiredMessage} />
      );
    case "already-member":
      return (
        <StatusPanel
          heading={confirmPage.alreadyMemberHeading}
          message={confirmPage.alreadyMemberMessage}
        />
      );
    case "confirm":
      return <ConfirmForm email={data.email} />;
  }
}

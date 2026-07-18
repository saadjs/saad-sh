import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  claimToken,
  getContact,
  recordConsent,
  releaseToken,
  upsertContact,
  verifyToken,
} from "#/lib/newsletter";
import { siteConfig } from "#/site.config";

const { confirmPage } = siteConfig.newsletter;

type ConfirmState =
  | { state: "invalid" }
  | { state: "expired" }
  | { state: "already-member" }
  | { state: "confirm"; email: string };

type ConfirmResult =
  | { state: "success" }
  | { state: "already-member" }
  | { state: "invalid" }
  | { state: "expired" }
  | { state: "error" };

// Read-only: verify the token and, if valid, look up membership. NO writes here
// so link scanners / prefetchers that hit the page on GET can't subscribe anyone.
// The actual write happens on the POST below, fired from a client effect --
// scanners fetch HTML but don't run JS, so only a real browser reaches it.
const getConfirmState = createServerFn({ method: "GET" })
  .inputValidator((token: string) => token)
  .handler(async ({ data: token }): Promise<ConfirmState> => {
    const verified = await verifyToken(token, env.NEWSLETTER_SIGNING_SECRET);
    if (verified.status === "invalid") return { state: "invalid" };
    if (verified.status === "expired") return { state: "expired" };

    // A membership lookup failure must not break the page for someone who just
    // clicked a link in their inbox. Fall back to running the confirm step:
    // confirming is idempotent, so an existing member simply re-confirms.
    try {
      const contact = await getContact(env.RESEND_AUDIENCE_ID, verified.email);
      if (contact && !contact.unsubscribed) return { state: "already-member" };
    } catch (error) {
      console.error("getConfirmState membership lookup failed", error);
    }
    return { state: "confirm", email: verified.email };
  });

// Write path: only reachable from a browser that executed JS (or clicked the
// error-state retry button).
const confirmSubscription = createServerFn({ method: "POST" })
  .inputValidator((token: string) => token)
  .handler(async ({ data: token }): Promise<ConfirmResult> => {
    const verified = await verifyToken(token, env.NEWSLETTER_SIGNING_SECRET);
    if (verified.status === "invalid") return { state: "invalid" };
    if (verified.status === "expired") return { state: "expired" };

    // Tokens are single-use. Losing this claim means the link was already
    // redeemed -- a re-click, a double-fired effect, or a replay. All three are
    // "you're already subscribed", not an error worth alarming anyone about.
    //
    // `unavailable` is distinct from `won` on purpose: it means no row was
    // written, so there is nothing of ours to release later. Treating it as
    // `won` would let a failed upsert delete a claim a concurrent request
    // legitimately holds.
    let claim: "won" | "lost" | "unavailable";
    try {
      claim = (await claimToken(env.NEWSLETTER_DB, token, verified.exp)) ? "won" : "lost";
    } catch (error) {
      // A D1 outage must not block a legitimate subscription. Fall through and
      // let the (idempotent) upsert run without replay protection.
      console.error("claimToken failed, proceeding without replay guard", error);
      claim = "unavailable";
    }
    if (claim === "lost") return { state: "already-member" };

    try {
      await upsertContact(env.RESEND_AUDIENCE_ID, verified.email);
    } catch (error) {
      console.error("confirmSubscription failed", error);
      // The claim guards a write that did not happen. Release it, or a
      // transient Resend error would spend the token for good: every later
      // visit to the link would lose the claim and be told "already a member"
      // while the address stays unsubscribed.
      if (claim === "won") {
        try {
          await releaseToken(env.NEWSLETTER_DB, token);
        } catch (releaseError) {
          console.error("releaseToken failed, token stranded", releaseError);
        }
      }
      return { state: "error" };
    }

    // Proof-of-consent log. Best-effort: the subscription already succeeded, so
    // a logging failure must not surface as an error to the subscriber.
    try {
      const request = getRequest();
      await recordConsent(env.NEWSLETTER_DB, verified.email, verified.exp, {
        ip: request.headers.get("CF-Connecting-IP") ?? undefined,
        userAgent: request.headers.get("User-Agent") ?? undefined,
        country: (request as { cf?: { country?: string } }).cf?.country,
      });
    } catch (error) {
      console.error("recordConsent failed", error);
    }

    return { state: "success" };
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

function AlreadyMemberPanel() {
  return (
    <StatusPanel
      heading={confirmPage.alreadyMemberHeading}
      message={confirmPage.alreadyMemberMessage}
    />
  );
}

function ConfirmingPanel({ email }: { email: string }) {
  return (
    <StatusPanel
      heading={confirmPage.confirmingHeading}
      message={confirmPage.confirmingMessage(email)}
    />
  );
}

function ConfirmPage() {
  const data = Route.useLoaderData();
  const { token } = Route.useSearch();
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  // The address the loader handed us on the pass that asked for a confirm.
  // Held here because a successful POST revalidates the loader to
  // `already-member`, after which `data.email` is gone but the retry copy and
  // the in-flight panel still need it.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  // StrictMode double-invokes effects in dev; without this the second call
  // would lose the token claim and render "already a member" on a fresh signup.
  const hasFired = useRef(false);

  const confirm = useCallback(async () => {
    setIsConfirming(true);
    try {
      setResult(await confirmSubscription({ data: token }));
    } catch (error) {
      console.error("confirmSubscription request failed", error);
      setResult({ state: "error" });
    } finally {
      setIsConfirming(false);
    }
  }, [token]);

  useEffect(() => {
    if (data.state !== "confirm" || hasFired.current) return;
    hasFired.current = true;
    setPendingEmail(data.email);
    void confirm();
  }, [data, confirm]);

  // This browser's own outcome outranks the loader. A successful POST
  // revalidates the loader, which then truthfully reports `already-member` --
  // but showing that to the person who just subscribed would swap
  // "You're subscribed!" for "You're already a member" a beat later.
  if (result?.state === "success") {
    return (
      <StatusPanel heading={confirmPage.successHeading} message={confirmPage.successMessage} />
    );
  }
  if (result?.state === "already-member") return <AlreadyMemberPanel />;
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
  // Error state: offer a manual retry rather than stranding them.
  if (result?.state === "error") {
    return (
      <StatusPanel
        heading={confirmPage.heading}
        message={confirmPage.description(pendingEmail ?? "")}
      >
        <p role="alert" className="text-sm text-foreground">
          {confirmPage.errorMessage}
        </p>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={isConfirming}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isConfirming ? confirmPage.confirmingLabel : confirmPage.confirmButtonLabel}
        </button>
      </StatusPanel>
    );
  }
  // Confirm is in flight. Also survives loader revalidation mid-request.
  if (pendingEmail) return <ConfirmingPanel email={pendingEmail} />;

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
      return <AlreadyMemberPanel />;
    case "confirm":
      // Server render and the tick before the effect fires. With JS disabled
      // this is the final state, hence the noscript fallback.
      return (
        <>
          <ConfirmingPanel email={data.email} />
          <noscript>
            <p className="mt-4 max-w-lg text-sm text-muted leading-relaxed">
              {confirmPage.noscriptMessage}
            </p>
          </noscript>
        </>
      );
  }
}

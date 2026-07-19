import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UpsertOutcome } from "#/lib/newsletter";
import {
  claimToken,
  getContact,
  recordConsent,
  releaseToken,
  sendSignupNotification,
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

// This page is the second half of double opt-in: the subscriber lands here by
// clicking the link in their confirmation email.
//
// It is split into a read-only GET and a write POST for one reason. Corporate
// mail scanners and inbox prefetchers follow links automatically, so anything
// that subscribed someone during a plain page load would subscribe people who
// never clicked. This handler therefore only reads. The write lives in the POST
// below, fired from a client effect: scanners fetch HTML but do not run JS, so
// in practice only a real browser gets that far.
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

    // Confirmation tokens are single-use, enforced by a row in D1. Losing the
    // claim means the link was already redeemed: a re-click, a double-fired
    // effect, or a replay. All three mean "you are already subscribed", which
    // is not an error worth alarming anyone about.
    //
    // The third state matters. `unavailable` means D1 itself failed, so no row
    // was written and there is nothing to release later. Folding it into `won`
    // would let a failed upsert delete a claim that a concurrent request holds.
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

    let outcome: UpsertOutcome;
    try {
      outcome = await upsertContact(env.RESEND_AUDIENCE_ID, verified.email);
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

    const request = getRequest();
    const country = (request as { cf?: { country?: string } }).cf?.country;

    // Proof-of-consent log. Best-effort: the subscription already succeeded, so
    // a logging failure must not surface as an error to the subscriber.
    try {
      await recordConsent(env.NEWSLETTER_DB, verified.email, verified.exp, {
        ip: request.headers.get("CF-Connecting-IP") ?? undefined,
        userAgent: request.headers.get("User-Agent") ?? undefined,
        country,
      });
    } catch (error) {
      console.error("recordConsent failed", error);
    }

    // Heads-up to the site owner. Best-effort for the same reason as the
    // consent log, and with even less claim on the subscriber: nobody's
    // subscription should fail because a notification could not be sent.
    //
    // Skipped when the contact was already subscribed, which happens when the
    // read-only handler above could not reach Resend and fell through. Nothing
    // changed in that case, so reporting it would invent a signup.
    if (outcome !== "already-active") {
      try {
        await sendSignupNotification({
          email: verified.email,
          outcome,
          exp: verified.exp,
          country,
          hostname: new URL(request.url).hostname,
        });
      } catch (error) {
        console.error("sendSignupNotification failed", error);
      }
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
  // The address from the loader pass that asked for a confirm. Copied into
  // state because a successful POST revalidates the loader to `already-member`,
  // and `data.email` disappears with it while the in-flight and retry panels
  // still need something to show.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  // React StrictMode double-invokes effects in development. Without this guard
  // the second call would lose the single-use token claim and render "already a
  // member" to someone who just signed up for the first time.
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

  // What this browser just did outranks whatever the loader says. A successful
  // POST triggers loader revalidation, which then correctly reports
  // `already-member` -- correct, but wrong to show: the person who just
  // subscribed would watch "You're subscribed!" turn into "You're already a
  // member" a moment later. These checks run before the loader switch below.
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
  // The POST is still in flight. Keyed off local state so it survives a loader
  // revalidation landing mid-request.
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
      // Covers the server render and the tick before the effect fires. With
      // JavaScript disabled nothing advances past this, so the noscript block
      // tells those visitors how to get subscribed anyway.
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

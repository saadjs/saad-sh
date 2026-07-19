import { env } from "cloudflare:workers";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

// ---------------------------------------------------------------------------
// Token signing / verification (HMAC-SHA256 over a base64url JSON payload)
// ---------------------------------------------------------------------------

const DEFAULT_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

type TokenPayload = { email: string; exp: number };

export type VerifyResult =
  | { status: "valid"; email: string; exp: number }
  | { status: "invalid" }
  | { status: "expired" };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64urlDecode(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Sign a confirmation token for the given email. The token is
 * `base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature)`.
 */
export async function signToken(
  email: string,
  secret: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<string> {
  const payload: TokenPayload = { email, exp: Date.now() + ttlMs };
  const encodedPayload = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));
  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  return `${encodedPayload}.${encodedSignature}`;
}

/**
 * Verify a confirmation token. Any malformed input returns `invalid`; a token
 * whose signature is valid but whose `exp` has passed returns `expired`. The
 * signature check uses `crypto.subtle.verify`, which compares in constant time.
 */
export async function verifyToken(token: string, secret: string): Promise<VerifyResult> {
  if (typeof token !== "string" || token.length === 0) return { status: "invalid" };

  const parts = token.split(".");
  if (parts.length !== 2) return { status: "invalid" };

  const [encodedPayload, encodedSignature] = parts;
  if (!encodedPayload || !encodedSignature) return { status: "invalid" };

  let signatureBytes: Uint8Array<ArrayBuffer>;
  try {
    signatureBytes = base64urlDecode(encodedSignature);
  } catch {
    return { status: "invalid" };
  }

  const key = await importHmacKey(secret);
  let signatureValid: boolean;
  try {
    signatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(encodedPayload),
    );
  } catch {
    return { status: "invalid" };
  }
  if (!signatureValid) return { status: "invalid" };

  // Signature is authentic; now the payload can be trusted enough to parse.
  let payload: unknown;
  try {
    payload = JSON.parse(decoder.decode(base64urlDecode(encodedPayload)));
  } catch {
    return { status: "invalid" };
  }

  if (typeof payload !== "object" || payload === null) return { status: "invalid" };
  const { email, exp } = payload as Record<string, unknown>;
  if (typeof email !== "string" || typeof exp !== "number") return { status: "invalid" };

  if (Date.now() > exp) return { status: "expired" };
  return { status: "valid", email, exp };
}

// ---------------------------------------------------------------------------
// Consent records + single-use tokens (D1)
// ---------------------------------------------------------------------------

export type ConsentContext = {
  ip?: string;
  userAgent?: string;
  country?: string;
};

/** SHA-256 of a token, hex-encoded. The raw token is never persisted. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Claim a confirmation token so it can only be redeemed once. Returns true if
 * this call won the claim, false if the token had already been used.
 *
 * The PRIMARY KEY on `token_hash` makes this atomic: two concurrent redemptions
 * race on the insert and exactly one sees a row change.
 */
export async function claimToken(db: D1Database, token: string, exp: number): Promise<boolean> {
  const result = await db
    .prepare("INSERT OR IGNORE INTO used_tokens (token_hash, used_at, expires_at) VALUES (?, ?, ?)")
    .bind(await hashToken(token), new Date().toISOString(), new Date(exp).toISOString())
    .run();

  return result.meta.changes > 0;
}

/**
 * Release a claim taken by `claimToken`. Called when the work the claim was
 * guarding did not happen, so the confirmation link stays usable for a retry.
 *
 * Only ever call this for a claim this request won. Releasing someone else's
 * claim would hand a spent token back to a replay.
 */
export async function releaseToken(db: D1Database, token: string): Promise<void> {
  await db
    .prepare("DELETE FROM used_tokens WHERE token_hash = ?")
    .bind(await hashToken(token))
    .run();
}

/**
 * Append a proof-of-consent row. Best-effort by design: a logging failure must
 * not stop someone from subscribing, so callers should catch and carry on.
 */
export async function recordConsent(
  db: D1Database,
  email: string,
  exp: number,
  context: ConsentContext,
): Promise<void> {
  // The token's exp is issue time + TTL, so working backwards gives issue time.
  const issuedAt = new Date(exp - DEFAULT_TTL_MS).toISOString();

  await db
    .prepare(
      `INSERT INTO consent_records (email, confirmed_at, ip, user_agent, country, token_issued_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      email,
      new Date().toISOString(),
      context.ip ?? null,
      context.userAgent ?? null,
      context.country ?? null,
      issuedAt,
    )
    .run();
}

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

/** Pragmatic email check. Trims + lowercases before validating. */
export function isValidEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

// ---------------------------------------------------------------------------
// Cloudflare Turnstile
// ---------------------------------------------------------------------------

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Verify a Turnstile token server-side. Returns false on any failure. */
export async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  let response: Response;
  try {
    response = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body });
  } catch (error) {
    console.error("Turnstile siteverify request failed", error);
    return false;
  }

  if (!response.ok) {
    console.error("Turnstile siteverify non-2xx", response.status, await response.text());
    return false;
  }

  const data = (await response.json()) as { success?: boolean };
  return data.success === true;
}

// ---------------------------------------------------------------------------
// Resend (contacts + transactional email)
// ---------------------------------------------------------------------------

const RESEND_API = "https://api.resend.com";

export type ResendContact = { id: string; unsubscribed: boolean };

/**
 * What an upsert actually changed. `already-active` means nothing did: the
 * contact was subscribed before the call and still is.
 */
export type UpsertOutcome = "created" | "reactivated" | "already-active";

/** The outcomes worth telling the site owner about. */
export type NotifiableOutcome = Exclude<UpsertOutcome, "already-active">;

function resendHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Retrieve a contact from the audience. Returns null on 404, throws on other non-2xx. */
export async function getContact(audienceId: string, email: string): Promise<ResendContact | null> {
  const url = `${RESEND_API}/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`;
  const response = await fetch(url, { method: "GET", headers: resendHeaders() });

  if (response.status === 404) return null;
  if (!response.ok) {
    console.error("Resend getContact failed", response.status, await response.text());
    throw new Error(`Resend getContact failed with status ${response.status}`);
  }

  const data = (await response.json()) as { id?: string; unsubscribed?: boolean };
  if (typeof data.id !== "string") {
    // Defensive: a missing contact answers 404 in practice, but treat an
    // id-less 200 as "not found" rather than trusting a half-shaped body.
    return null;
  }
  return { id: data.id, unsubscribed: data.unsubscribed === true };
}

/**
 * Ensure the email is a subscribed contact in the audience, whatever state it
 * started in. Safe to call twice; confirming an existing subscriber is a no-op.
 *
 * Returns what changed, because the caller cannot tell afterwards and the three
 * cases mean different things: a first-time signup, someone returning after
 * unsubscribing, or nothing at all.
 */
export async function upsertContact(audienceId: string, email: string): Promise<UpsertOutcome> {
  const existing = await getContact(audienceId, email);

  if (existing) {
    // Already subscribed: nothing to write. Worth its own outcome because the
    // confirm page reaches here when its own membership check failed and it
    // fell through, and calling that a resubscription would report a signup
    // that never happened.
    if (!existing.unsubscribed) return "already-active";

    const url = `${RESEND_API}/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: resendHeaders(),
      body: JSON.stringify({ unsubscribed: false }),
    });
    if (!response.ok) {
      console.error("Resend updateContact failed", response.status, await response.text());
      throw new Error(`Resend updateContact failed with status ${response.status}`);
    }
    return "reactivated";
  }

  const response = await fetch(`${RESEND_API}/audiences/${audienceId}/contacts`, {
    method: "POST",
    headers: resendHeaders(),
    body: JSON.stringify({ email, unsubscribed: false }),
  });
  if (!response.ok) {
    console.error("Resend createContact failed", response.status, await response.text());
    throw new Error(`Resend createContact failed with status ${response.status}`);
  }
  return "created";
}

function confirmationEmailHtml(confirmUrl: string): string {
  // Always absolute against the production URL, never the request origin:
  // localhost URL would render as a broken image in the recipient's inbox.
  const logoUrl = absoluteUrl(siteConfig.newsletter.emailLogo, siteConfig.url);
  const siteUrl = siteConfig.url;

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f6f6f6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f6;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e5e5e5;border-radius:8px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${siteUrl}" style="text-decoration:none;">
                  <img src="${logoUrl}" width="48" height="48" alt="${siteConfig.name}" style="display:block;width:48px;height:48px;border:0;outline:none;text-decoration:none;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="font-size:16px;line-height:1.5;padding-bottom:20px;">
                Thanks for subscribing to the <strong>${siteConfig.name}</strong> newsletter. Please confirm your email address to finish signing up.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <a href="${confirmUrl}" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:6px;">Confirm subscription</a>
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;line-height:1.5;color:#666666;">
                This link expires in 48 hours. If you didn&rsquo;t request this, you can safely ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function confirmationEmailText(confirmUrl: string): string {
  return [
    `Thanks for subscribing to the ${siteConfig.name} newsletter.`,
    "",
    "Please confirm your email address to finish signing up:",
    confirmUrl,
    "",
    "This link expires in 48 hours. If you didn't request this, you can safely ignore this email.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Signup notification (to the site owner, not the subscriber)
// ---------------------------------------------------------------------------

export type SignupNotification = {
  email: string;
  outcome: NotifiableOutcome;
  /** Token expiry, which is issue time + TTL, so signup time works back from it. */
  exp: number;
  country?: string;
  /** Host that served the confirmation. Decides the [dev] subject prefix. */
  hostname: string;
};

/**
 * Local dev talks to the real Resend account, so a notification triggered by
 * `pnpm dev` is indistinguishable from a real signup unless it says so.
 *
 * Lists the non-production hosts rather than checking for `saad.sh`, because
 * the worker serves several custom domains (see `routes` in wrangler.jsonc) and
 * the confirmation link is built from whichever one the visitor signed up on.
 * Matching a single canonical hostname would flag real confirmations as dev.
 *
 * `.workers.dev` covers the account subdomain and per-version preview URLs,
 * both enabled by default. A confirmation arriving there is a test, not a
 * signup someone made from the site.
 */
function isDevHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".workers.dev")
  );
}

/**
 * How long a subscriber took to confirm, phrased for a human skimming an email.
 * Rounded on purpose: the useful signal is "right away" versus "next morning".
 */
function formatElapsed(ms: number): string {
  if (ms < 0) return "unknown";

  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "under a minute";
  if (minutes === 1) return "1 minute";
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

/**
 * Compose the notification sent to the site owner when someone confirms.
 *
 * Kept pure and separate from the send so the wording can be tested without a
 * network call. `now` is injectable for the same reason.
 */
export function buildSignupNotification(
  notification: SignupNotification,
  now: number = Date.now(),
): { subject: string; text: string } {
  const { email, outcome, exp, country, hostname } = notification;

  const label = outcome === "created" ? "New subscriber" : "Resubscribed";
  const prefix = isDevHost(hostname) ? "[dev] " : "";
  // Recovers signup time the same way recordConsent does.
  const elapsed = formatElapsed(now - (exp - DEFAULT_TTL_MS));

  // One space after each label, never padding. Mail clients render text/plain
  // in a proportional font, where padded columns do not line up: the padding
  // only produces a ragged left edge down the values.
  const text = [
    `${label}: ${email}`,
    "",
    `Country: ${country ?? "unknown"}`,
    `Confirmed: ${elapsed} after signing up`,
    `Site: ${hostname}`,
  ].join("\n");

  return { subject: `${prefix}${label}: ${email}`, text };
}

/**
 * Email the site owner that someone confirmed.
 *
 * Throws on non-2xx, but callers are expected to catch and continue: the
 * subscription has already succeeded by this point, and a heads-up that failed
 * to send is no reason to show the subscriber an error.
 */
export async function sendSignupNotification(notification: SignupNotification): Promise<void> {
  const { subject, text } = buildSignupNotification(notification);
  const { notifications } = siteConfig.newsletter;

  const response = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: resendHeaders(),
    body: JSON.stringify({
      from: notifications.from,
      to: [notifications.to],
      // Hitting reply in the inbox writes to the new subscriber, not to me.
      reply_to: notification.email,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    console.error("Resend signup notification failed", response.status, await response.text());
    throw new Error(`Resend signup notification failed with status ${response.status}`);
  }
}

/** Send the double opt-in confirmation email via Resend. Throws on non-2xx. */
export async function sendConfirmationEmail(email: string, confirmUrl: string): Promise<void> {
  const response = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: resendHeaders(),
    body: JSON.stringify({
      from: siteConfig.newsletter.from,
      to: [email],
      reply_to: siteConfig.newsletter.replyTo,
      subject: siteConfig.newsletter.confirmSubject,
      html: confirmationEmailHtml(confirmUrl),
      text: confirmationEmailText(confirmUrl),
    }),
  });

  if (!response.ok) {
    console.error("Resend sendEmail failed", response.status, await response.text());
    throw new Error(`Resend sendEmail failed with status ${response.status}`);
  }
}

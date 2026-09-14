import { env } from "cloudflare:workers";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";
import { hashToken } from "#/lib/crypto";
import { signPayload, verifyPayload } from "#/lib/tokens";

export { hashToken };

const DEFAULT_TTL_MS = 48 * 60 * 60 * 1000;

export type VerifyResult =
  | { status: "valid"; email: string; exp: number }
  | { status: "invalid" }
  | { status: "expired" };

export async function signToken(
  email: string,
  secret: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<string> {
  return signPayload({ email }, secret, ttlMs);
}

export async function verifyToken(token: string, secret: string): Promise<VerifyResult> {
  const result = await verifyPayload<{ email: unknown }>(token, secret);
  if (result.status !== "valid") return { status: result.status };
  const { email, exp } = result.payload;
  if (typeof email !== "string") return { status: "invalid" };
  return { status: "valid", email, exp };
}

export type ConsentContext = {
  ip?: string;
  userAgent?: string;
  country?: string;
};

export async function claimToken(db: D1Database, token: string, exp: number): Promise<boolean> {
  const result = await db
    .prepare("INSERT OR IGNORE INTO used_tokens (token_hash, used_at, expires_at) VALUES (?, ?, ?)")
    .bind(await hashToken(token), new Date().toISOString(), new Date(exp).toISOString())
    .run();

  return result.meta.changes > 0;
}

export async function releaseToken(db: D1Database, token: string): Promise<void> {
  await db
    .prepare("DELETE FROM used_tokens WHERE token_hash = ?")
    .bind(await hashToken(token))
    .run();
}

export async function recordConsent(
  db: D1Database,
  email: string,
  exp: number,
  context: ConsentContext,
): Promise<void> {
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

export function isValidEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

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

const RESEND_API = "https://api.resend.com";

export type ResendContact = { id: string; unsubscribed: boolean };

export type UpsertOutcome = "created" | "reactivated" | "already-active";

export type NotifiableOutcome = Exclude<UpsertOutcome, "already-active">;

function resendHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  };
}

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
    return null;
  }
  return { id: data.id, unsubscribed: data.unsubscribed === true };
}

export async function upsertContact(audienceId: string, email: string): Promise<UpsertOutcome> {
  const existing = await getContact(audienceId, email);

  if (existing) {
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

export type SignupNotification = {
  email: string;
  outcome: NotifiableOutcome;
  exp: number;
  country?: string;
  hostname: string;
};

function isDevHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".workers.dev")
  );
}

function formatElapsed(ms: number): string {
  if (ms < 0) return "unknown";

  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "under a minute";
  if (minutes === 1) return "1 minute";
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export function buildSignupNotification(
  notification: SignupNotification,
  now: number = Date.now(),
): { subject: string; text: string } {
  const { email, outcome, exp, country, hostname } = notification;

  const label = outcome === "created" ? "New subscriber" : "Resubscribed";
  const prefix = isDevHost(hostname) ? "[dev] " : "";
  const elapsed = formatElapsed(now - (exp - DEFAULT_TTL_MS));

  const text = [
    `${label}: ${email}`,
    "",
    `Country: ${country ?? "unknown"}`,
    `Confirmed: ${elapsed} after signing up`,
    `Site: ${hostname}`,
  ].join("\n");

  return { subject: `${prefix}${label}: ${email}`, text };
}

export async function sendSignupNotification(notification: SignupNotification): Promise<void> {
  const { subject, text } = buildSignupNotification(notification);
  const { notifications } = siteConfig.newsletter;

  const response = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: resendHeaders(),
    body: JSON.stringify({
      from: notifications.from,
      to: [notifications.to],
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

import { env } from "cloudflare:workers";
import { hashToken, randomToken } from "./crypto";

export const ADMIN_HOST = "saad.sh";
const DEV_HOSTS = new Set(["localhost", "127.0.0.1"]);

const SESSION_COOKIE = "__Host-admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const ENROLLMENT_TTL_MS = 15 * 60 * 1000;

export type Session = {
  credentialId: string;
  expiresAt: string;
};

export function isDevHost(hostname: string): boolean {
  return DEV_HOSTS.has(hostname) || hostname.endsWith(".localhost");
}

export function relyingPartyId(url: URL): string {
  return isDevHost(url.hostname) ? url.hostname : ADMIN_HOST;
}

export function expectedOrigin(url: URL): string {
  return isDevHost(url.hostname) ? url.origin : `https://${ADMIN_HOST}`;
}

export function isAdminHost(url: URL): boolean {
  return url.hostname === ADMIN_HOST || isDevHost(url.hostname);
}

function db(): D1Database {
  return env.CONTENT_DB;
}

export function notFound(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow" },
  });
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...headers,
    },
  });
}

export function hasValidOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

function cookieHeader(value: string, maxAgeSeconds: number, secure: boolean): string {
  const name = secure ? SESSION_COOKIE : SESSION_COOKIE.replace("__Host-", "");
  const attributes = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

function sessionCookieName(url: URL): string {
  return isDevHost(url.hostname) ? SESSION_COOKIE.replace("__Host-", "") : SESSION_COOKIE;
}

export async function createSession(
  credentialId: string,
  request: Request,
): Promise<{ cookie: string }> {
  const url = new URL(request.url);
  const token = randomToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  await db()
    .prepare(
      `INSERT INTO sessions (id_hash, credential_id, created_at, expires_at, last_seen_at, user_agent, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      await hashToken(token),
      credentialId,
      now.toISOString(),
      expiresAt.toISOString(),
      now.toISOString(),
      request.headers.get("User-Agent"),
      request.headers.get("CF-Connecting-IP"),
    )
    .run();

  return {
    cookie: cookieHeader(token, Math.floor(SESSION_TTL_MS / 1000), !isDevHost(url.hostname)),
  };
}

export async function getSession(request: Request): Promise<Session | null> {
  const url = new URL(request.url);
  const token = readCookie(request, sessionCookieName(url));
  if (!token) return null;

  const idHash = await hashToken(token);
  const row = await db()
    .prepare(
      `SELECT s.credential_id, s.expires_at FROM sessions s
       INNER JOIN credentials c ON c.id = s.credential_id
       WHERE s.id_hash = ?`,
    )
    .bind(idHash)
    .first<{ credential_id: string; expires_at: string }>();
  if (!row) return null;

  if (Date.parse(row.expires_at) <= Date.now()) {
    await db().prepare("DELETE FROM sessions WHERE id_hash = ?").bind(idHash).run();
    return null;
  }

  await db()
    .prepare("UPDATE sessions SET last_seen_at = ? WHERE id_hash = ?")
    .bind(new Date().toISOString(), idHash)
    .run();

  return { credentialId: row.credential_id, expiresAt: row.expires_at };
}

export async function revokeSession(request: Request): Promise<string> {
  const url = new URL(request.url);
  const token = readCookie(request, sessionCookieName(url));
  if (token) {
    await db()
      .prepare("DELETE FROM sessions WHERE id_hash = ?")
      .bind(await hashToken(token))
      .run();
  }
  return cookieHeader("", 0, !isDevHost(url.hostname));
}

export async function storeChallenge(challenge: string, purpose: string): Promise<void> {
  const now = Date.now();
  await db()
    .prepare(
      "INSERT OR REPLACE INTO auth_challenges (challenge, purpose, created_at, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(
      challenge,
      purpose,
      new Date(now).toISOString(),
      new Date(now + CHALLENGE_TTL_MS).toISOString(),
    )
    .run();
}

export async function claimChallenge(challenge: string, purpose: string): Promise<boolean> {
  const row = await db()
    .prepare("DELETE FROM auth_challenges WHERE challenge = ? AND purpose = ? RETURNING expires_at")
    .bind(challenge, purpose)
    .first<{ expires_at: string }>();
  return Boolean(row) && Date.parse(row!.expires_at) > Date.now();
}

export async function createEnrollmentToken(): Promise<string> {
  const token = randomToken();
  const now = Date.now();
  await db()
    .prepare("INSERT INTO enrollment_tokens (token_hash, created_at, expires_at) VALUES (?, ?, ?)")
    .bind(
      await hashToken(token),
      new Date(now).toISOString(),
      new Date(now + ENROLLMENT_TTL_MS).toISOString(),
    )
    .run();
  return token;
}

export async function enrollmentTokenValid(token: string): Promise<boolean> {
  if (!token) return false;
  const row = await db()
    .prepare("SELECT expires_at FROM enrollment_tokens WHERE token_hash = ? AND used_at IS NULL")
    .bind(await hashToken(token))
    .first<{ expires_at: string }>();
  return Boolean(row) && Date.parse(row!.expires_at) > Date.now();
}

export async function claimEnrollmentToken(token: string): Promise<boolean> {
  if (!token) return false;
  const row = await db()
    .prepare(
      "DELETE FROM enrollment_tokens WHERE token_hash = ? AND used_at IS NULL RETURNING expires_at",
    )
    .bind(await hashToken(token))
    .first<{ expires_at: string }>();
  return Boolean(row) && Date.parse(row!.expires_at) > Date.now();
}

export async function credentialCount(): Promise<number> {
  const row = await db()
    .prepare("SELECT COUNT(*) AS total FROM credentials")
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function audit(
  action: string,
  request: Request,
  extra: { slug?: string; detail?: string } = {},
): Promise<void> {
  try {
    await db()
      .prepare(
        "INSERT INTO audit_log (at, action, slug, detail, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(
        new Date().toISOString(),
        action,
        extra.slug ?? null,
        extra.detail ?? null,
        request.headers.get("CF-Connecting-IP"),
        request.headers.get("User-Agent"),
      )
      .run();
  } catch (error) {
    console.error("audit log write failed", error);
  }
}

export async function tooManyAttempts(
  request: Request,
  action: string,
  limit = 10,
  windowMs = 10 * 60 * 1000,
): Promise<boolean> {
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) return false;

  const row = await db()
    .prepare("SELECT COUNT(*) AS total FROM audit_log WHERE action = ? AND ip = ? AND at > ?")
    .bind(action, ip, new Date(Date.now() - windowMs).toISOString())
    .first<{ total: number }>();

  return (row?.total ?? 0) >= limit;
}

export async function requireAdmin(request: Request): Promise<Session | null> {
  if (!isAdminHost(new URL(request.url))) return null;
  return getSession(request);
}

export async function denyUnlessAdmin(
  request: Request,
  mutation = false,
): Promise<Response | null> {
  const session = await requireAdmin(request);
  if (!session) return notFound();
  if (mutation && !hasValidOrigin(request)) return notFound();
  return null;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80;
}

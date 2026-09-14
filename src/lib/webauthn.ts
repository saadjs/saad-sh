import { env } from "cloudflare:workers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { base64urlDecode, base64urlEncode } from "./crypto";
import { expectedOrigin, relyingPartyId, storeChallenge } from "./admin-auth";
import { siteConfig } from "#/site.config";

const USER_ID = new TextEncoder().encode("saad-sh-admin");
const USER_NAME = "admin";

export type CredentialRow = {
  id: string;
  public_key: string;
  counter: number;
  transports: string | null;
  nickname: string;
};

function db(): D1Database {
  return env.CONTENT_DB;
}

async function listCredentials(): Promise<CredentialRow[]> {
  const { results } = await db()
    .prepare(
      "SELECT id, public_key, counter, transports, nickname FROM credentials ORDER BY created_at",
    )
    .all<CredentialRow>();
  return results;
}

export async function registrationOptions(url: URL) {
  const existing = await listCredentials();

  const options = await generateRegistrationOptions({
    rpName: siteConfig.name,
    rpID: relyingPartyId(url),
    userID: USER_ID,
    userName: USER_NAME,
    attestationType: "none",
    excludeCredentials: existing.map((credential) => ({ id: credential.id })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
    },
  });

  await storeChallenge(options.challenge, "register");
  return options;
}

export async function verifyRegistration(
  url: URL,
  response: RegistrationResponseJSON,
  challenge: string,
  nickname: string,
): Promise<boolean> {
  let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: expectedOrigin(url),
      expectedRPID: relyingPartyId(url),
      requireUserVerification: true,
    });
  } catch (error) {
    console.error("passkey registration failed verification", error);
    return false;
  }

  if (!verification.verified || !verification.registrationInfo) return false;
  const { credential } = verification.registrationInfo;

  await db()
    .prepare(
      `INSERT INTO credentials (id, public_key, counter, transports, nickname, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      credential.id,
      base64urlEncode(credential.publicKey),
      credential.counter,
      JSON.stringify(credential.transports ?? []),
      nickname.slice(0, 60),
      new Date().toISOString(),
    )
    .run();

  return true;
}

export function counterIsValid(stored: number, received: number): boolean {
  return stored === 0 || received > stored;
}

export async function authenticationOptions(url: URL) {
  const options = await generateAuthenticationOptions({
    rpID: relyingPartyId(url),
    userVerification: "required",
  });
  await storeChallenge(options.challenge, "authenticate");
  return options;
}

export async function verifyAuthentication(
  url: URL,
  response: AuthenticationResponseJSON,
  challenge: string,
): Promise<string | null> {
  const row = await db()
    .prepare("SELECT id, public_key, counter, transports FROM credentials WHERE id = ?")
    .bind(response.id)
    .first<CredentialRow>();
  if (!row) return null;

  let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: expectedOrigin(url),
      expectedRPID: relyingPartyId(url),
      requireUserVerification: true,
      credential: {
        id: row.id,
        publicKey: base64urlDecode(row.public_key),
        counter: row.counter,
        transports: row.transports ? (JSON.parse(row.transports) as []) : undefined,
      },
    });
  } catch (error) {
    console.error("passkey authentication failed verification", error);
    return null;
  }

  if (!verification.verified) return null;

  const { newCounter } = verification.authenticationInfo;
  if (!counterIsValid(row.counter, newCounter)) {
    console.error("passkey counter did not increase", {
      stored: row.counter,
      received: newCounter,
    });
    return null;
  }

  await db()
    .prepare("UPDATE credentials SET counter = ?, last_used_at = ? WHERE id = ?")
    .bind(newCounter, new Date().toISOString(), row.id)
    .run();

  return row.id;
}

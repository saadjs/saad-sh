import { base64urlDecode, base64urlEncode } from "./crypto";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type Verified<T> =
  | { status: "valid"; payload: T & { exp: number } }
  | { status: "invalid" }
  | { status: "expired" };

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signPayload<T extends object>(
  payload: T,
  secret: string,
  ttlMs: number,
): Promise<string> {
  const body = { ...payload, exp: Date.now() + ttlMs };
  const encodedPayload = base64urlEncode(encoder.encode(JSON.stringify(body)));
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));
  return `${encodedPayload}.${base64urlEncode(new Uint8Array(signature))}`;
}

export async function verifyPayload<T>(token: string, secret: string): Promise<Verified<T>> {
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

  // Replay protection hashes the token text. Accept exactly one spelling of
  // each signature, including its unused trailing bits and lack of padding.
  if (signatureBytes.length !== 32 || base64urlEncode(signatureBytes) !== encodedSignature) {
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

  let payload: unknown;
  try {
    payload = JSON.parse(decoder.decode(base64urlDecode(encodedPayload)));
  } catch {
    return { status: "invalid" };
  }

  if (typeof payload !== "object" || payload === null) return { status: "invalid" };
  const { exp } = payload as { exp?: unknown };
  if (typeof exp !== "number") return { status: "invalid" };
  if (Date.now() > exp) return { status: "expired" };

  return { status: "valid", payload: payload as T & { exp: number } };
}

import { env } from "cloudflare:workers";
import { signPayload, verifyPayload } from "./tokens";

const PREVIEW_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const PREVIEW_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function signPreviewToken(slug: string): Promise<string> {
  return signPayload({ slug }, env.PREVIEW_SIGNING_SECRET, PREVIEW_TTL_MS);
}

export async function previewTokenMatches(token: string, slug: string): Promise<boolean> {
  const result = await verifyPayload<{ slug: unknown }>(token, env.PREVIEW_SIGNING_SECRET);
  return result.status === "valid" && result.payload.slug === slug;
}

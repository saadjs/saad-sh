import { env } from "cloudflare:workers";

export function newsletterEnabled(): boolean {
  return String(env.NEWSLETTER_ENABLED) === "true";
}

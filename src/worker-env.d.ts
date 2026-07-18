// Ambient typing for the environment bindings this app reads via
// `import { env } from "cloudflare:workers"`. Keep in sync with the secrets in
// `.dev.vars` (see `.dev.vars.example`) and the `vars` block in `wrangler.jsonc`.
declare module "cloudflare:workers" {
  interface NewsletterEnv {
    /** Resend API key (secret). */
    RESEND_API_KEY: string;
    /** HMAC signing secret for confirmation tokens (secret). */
    NEWSLETTER_SIGNING_SECRET: string;
    /** Cloudflare Turnstile secret key (secret). */
    TURNSTILE_SECRET_KEY: string;
    /** Resend audience id the newsletter subscribes contacts to (plain var). */
    RESEND_AUDIENCE_ID: string;
  }

  export const env: NewsletterEnv;
}

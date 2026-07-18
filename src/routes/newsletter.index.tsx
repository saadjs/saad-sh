import { createFileRoute } from "@tanstack/react-router";
import { NewsletterSignup } from "#/components";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

const { newsletter } = siteConfig;

export const Route = createFileRoute("/newsletter/")({
  head: () => ({
    meta: [
      { title: siteConfig.titleTemplate.replace("%s", newsletter.page.title) },
      { name: "description", content: newsletter.page.description },
      { property: "og:title", content: newsletter.page.title },
      { property: "og:description", content: newsletter.page.description },
      { property: "og:url", content: absoluteUrl(siteConfig.routes.newsletter, siteConfig.url) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(siteConfig.routes.newsletter, siteConfig.url) }],
  }),
  component: NewsletterPage,
});

function NewsletterPage() {
  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        {newsletter.eyebrow}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {newsletter.heading}
      </h1>
      <p className="max-w-lg text-muted leading-relaxed">{newsletter.description}</p>
      <div className="pt-1">
        <NewsletterSignup />
      </div>
    </div>
  );
}

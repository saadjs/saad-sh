import { createFileRoute, notFound } from "@tanstack/react-router";
import { NewsletterSignup } from "#/components/NewsletterSignup";
import { MarkedTitle } from "#/components/Sketch";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

const { newsletter } = siteConfig;

export const Route = createFileRoute("/newsletter/")({
  beforeLoad: ({ context }) => {
    if (!context.features.newsletter) throw notFound();
  },
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
      <MarkedTitle text={newsletter.heading} />
      <p className="max-w-lg pt-2 leading-relaxed">{newsletter.description}</p>
      <div className="pt-1">
        <NewsletterSignup />
      </div>
    </div>
  );
}

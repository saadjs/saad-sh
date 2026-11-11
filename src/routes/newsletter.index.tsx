import { createFileRoute, notFound } from "@tanstack/react-router";
import { NewsletterSignup } from "#/components/NewsletterSignup";
import { PageHead } from "#/components/PageHead";
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
    <div className="page">
      <PageHead title={newsletter.heading} intro={newsletter.description} />
      <NewsletterSignup />
    </div>
  );
}

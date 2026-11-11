import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { siteConfig } from "#/site.config";
import { ContentLink } from "#/components/ContentLink";
import { PageHead } from "#/components/PageHead";
import Content from "#/content/pages/about.mdx";
import { absoluteUrl, ogImagePath } from "#/lib/utils";

const { author, aboutPage } = siteConfig;

function AuthorLinks() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href={`mailto:${author.email}`} className="ui-btn ui-btn-primary">
        Email
      </a>
      <a href={author.github} target="_blank" rel="noreferrer" className="ui-btn">
        GitHub
      </a>
      <a href={author.linkedin} target="_blank" rel="noreferrer" className="ui-btn">
        LinkedIn
      </a>
    </div>
  );
}

function SayHello({ children }: { children: ReactNode }) {
  return <section className="say-hello ui-panel mt-10 px-6 py-6">{children}</section>;
}

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `${aboutPage.title} | ${siteConfig.name}` },
      { name: "description", content: aboutPage.description },
      { property: "og:title", content: aboutPage.title },
      { property: "og:description", content: aboutPage.description },
      { property: "og:url", content: `${siteConfig.url}${siteConfig.routes.about}` },
      { property: "og:image", content: absoluteUrl(ogImagePath(), siteConfig.url) },
      { name: "twitter:title", content: aboutPage.title },
      { name: "twitter:description", content: aboutPage.description },
      { name: "twitter:image", content: absoluteUrl(ogImagePath(), siteConfig.url) },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(siteConfig.routes.about, siteConfig.url) }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="page about-page">
      <PageHead title={aboutPage.heading} />
      <div className="post-body">
        <Content components={{ AuthorLinks, SayHello, a: ContentLink }} />
      </div>
    </div>
  );
}

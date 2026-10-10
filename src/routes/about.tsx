import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { siteConfig } from "#/site.config";
import { ContentLink } from "#/components/ContentLink";
import { HandNote, MarkedTitle } from "#/components/Sketch";
import Content from "#/content/pages/about.mdx";
import { absoluteUrl, ogImagePath } from "#/lib/utils";

const { author, aboutPage } = siteConfig;

function AuthorLinks() {
  return (
    <div className="mt-[1.125rem] flex flex-wrap items-center gap-x-4 gap-y-3.5">
      <a href={`mailto:${author.email}`} className="sketch-btn sketch-btn-marker px-5">
        Email
      </a>
      <a href={author.github} target="_blank" rel="noreferrer" className="sketch-btn px-5">
        GitHub
      </a>
      <a href={author.linkedin} target="_blank" rel="noreferrer" className="sketch-btn px-5">
        LinkedIn
      </a>
      <HandNote arrow="left">{aboutPage.contactNote}</HandNote>
    </div>
  );
}

function SayHello({ children }: { children: ReactNode }) {
  return <section className="sketch-box mt-11 px-[1.375rem] py-6">{children}</section>;
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
    <div>
      <MarkedTitle text={aboutPage.heading} />
      <div className="mt-11">
        <Content
          components={{
            AuthorLinks,
            SayHello,
            a: ContentLink,
            p: ({ children }) => <p className="mt-5 max-w-[37.5rem] first:mt-0">{children}</p>,
            h2: ({ children, ...props }) => (
              <h2
                {...props}
                className="mb-1.5 text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]"
              >
                {children}
              </h2>
            ),
          }}
        />
      </div>
    </div>
  );
}

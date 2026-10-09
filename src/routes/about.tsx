import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";
import { ContentLink } from "#/components/ContentLink";
import Content from "#/content/pages/about.mdx";
import { absoluteUrl, ogImagePath } from "#/lib/utils";

const { author, aboutPage } = siteConfig;

function AuthorLinks() {
  const linkClass = "touch-target text-accent underline-offset-4 hover:underline";
  return (
    <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem]">
      <a href={`mailto:${author.email}`} className={linkClass}>
        Email <span aria-hidden="true">↗</span>
      </a>
      <a href={author.github} target="_blank" rel="noreferrer" className={linkClass}>
        GitHub <span aria-hidden="true">↗</span>
      </a>
      <a href={author.linkedin} target="_blank" rel="noreferrer" className={linkClass}>
        LinkedIn <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
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
      <h1 className="page-title mb-[1.125rem]">{aboutPage.heading}</h1>
      <div className="max-w-[31.875rem]">
        <Content
          components={{
            AuthorLinks,
            a: ({ className, ...props }) => (
              <ContentLink
                {...props}
                className={`text-foreground decoration-border hover:decoration-accent ${className ?? ""}`}
              />
            ),
            p: ({ children }) => <p className="mt-[1.375rem] first:mt-0">{children}</p>,
            h2: ({ children, ...props }) => (
              <h2 {...props} className="mt-9 mb-3 text-[1.0625rem] font-medium tracking-tight">
                {children}
              </h2>
            ),
          }}
        />
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import type { ComponentPropsWithoutRef } from "react";
import { siteConfig } from "#/site.config";
import { GitHubIcon, LinkedInIcon } from "#/components";
import Content from "#/content/pages/about.mdx";
import { absoluteUrl } from "#/lib/utils";

const { author, aboutPage } = siteConfig;

type AnchorProps = ComponentPropsWithoutRef<"a">;

const TagLink = ({ className, ...props }: AnchorProps) => (
  <a
    {...props}
    className={`text-accent transition-colors hover:underline ${className ?? ""}`.trim()}
  />
);

function MailIcon(props: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
      <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
    </svg>
  );
}

function AuthorLinks() {
  const linkClass = "text-muted transition-colors hover:text-foreground";

  return (
    <section>
      <div className="flex gap-4">
        <a href={`mailto:${author.email}`} aria-label="Email" className={linkClass}>
          <MailIcon className="h-5 w-5" />
        </a>
        <a
          href={author.github}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className={linkClass}
        >
          <GitHubIcon className="h-5 w-5" />
        </a>
        <a
          href={author.linkedin}
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          className={linkClass}
        >
          <LinkedInIcon className="h-5 w-5" />
        </a>
      </div>
    </section>
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
      { property: "og:image", content: author.avatar },
      { name: "twitter:title", content: aboutPage.title },
      { name: "twitter:description", content: aboutPage.description },
      { name: "twitter:image", content: author.avatar },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(siteConfig.routes.about, siteConfig.url) }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-8 md:flex-row md:items-center">
        <div className="relative h-32 w-32 overflow-hidden rounded-full border border-border">
          <img
            src={author.avatar}
            alt={`${author.name} avatar`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{author.name}</h1>
          <p className="text-muted">{author.occupation}</p>
        </div>
      </header>

      <Content components={{ a: TagLink, AuthorLinks }} />
    </div>
  );
}

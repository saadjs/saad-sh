import Image from "next/image";
import type { Metadata } from "next";
import type { ComponentPropsWithoutRef } from "react";
import { siteConfig } from "@/site.config";
import { GitHubIcon, LinkedInIcon } from "@/components";
import Content from "@/content/pages/about.mdx";

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

export const metadata: Metadata = {
  title: aboutPage.title,
  description: aboutPage.description,
  alternates: {
    canonical: siteConfig.routes.about,
    types: siteConfig.alternateTypes,
  },
  openGraph: {
    title: aboutPage.title,
    description: aboutPage.description,
    url: `${siteConfig.url}${siteConfig.routes.about}`,
    images: [{ url: author.avatar }],
  },
  twitter: {
    card: siteConfig.twitterCard,
    title: aboutPage.title,
    description: aboutPage.description,
    images: [author.avatar],
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-8 md:flex-row md:items-center">
        <div className="relative h-32 w-32 overflow-hidden rounded-full border border-border">
          <Image
            src={author.avatar}
            alt={`${author.name} avatar`}
            fill
            sizes="128px"
            className="object-cover"
            priority
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

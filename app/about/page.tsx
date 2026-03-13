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
    className={`text-tag transition-opacity hover:opacity-80 ${className ?? ""}`.trim()}
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
  const linkClass =
    "rounded-full border border-zinc-200/80 p-2.5 text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:text-zinc-100";

  return (
    <section>
      <div className="flex gap-3">
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
        <div className="relative h-32 w-32 overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-800">
          <Image
            src={author.avatar}
            alt={`${author.name} avatar`}
            fill
            sizes="128px"
            className="object-cover"
            priority
          />
        </div>
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            {aboutPage.kicker}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {author.name}
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400">{author.occupation}</p>
        </div>
      </header>

      <Content components={{ a: TagLink, AuthorLinks }} />
    </div>
  );
}

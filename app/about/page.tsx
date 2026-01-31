import Image from "next/image";
import type { Metadata } from "next";
import type { ComponentPropsWithoutRef } from "react";
import { siteConfig } from "@/site.config";
import Content from "@/content/pages/about.mdx";

const { author, aboutPage } = siteConfig;

type AnchorProps = ComponentPropsWithoutRef<"a">;

const TagLink = ({ className, ...props }: AnchorProps) => (
  <a
    {...props}
    className={`text-tag transition-opacity hover:opacity-80 ${className ?? ""}`.trim()}
  />
);

function AuthorLinks() {
  return (
    <section>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Email</dt>
          <dd>
            <TagLink href={`mailto:${author.email}`}>{author.email}</TagLink>
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">LinkedIn</dt>
          <dd>
            <TagLink href={author.linkedin} rel="noreferrer" target="_blank">
              {author.linkedin.replace("https://", "")}
            </TagLink>
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">GitHub</dt>
          <dd>
            <TagLink href={author.github} rel="noreferrer" target="_blank">
              {author.github.replace("https://", "")}
            </TagLink>
          </dd>
        </div>
      </dl>
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

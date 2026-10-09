import { createFileRoute, Link } from "@tanstack/react-router";
import {
  projects,
  projectSlug,
  resolveProjectLink,
  type Project,
  type ProjectLink,
} from "#/lib/projects";
import { siteConfig } from "#/site.config";
import { getLinkNavigationProps } from "#/lib/links";
import { absoluteUrl, ogImagePath } from "#/lib/utils";

const projectsUrl = absoluteUrl(siteConfig.routes.projects, siteConfig.url);
const projectsImage = absoluteUrl(ogImagePath(), siteConfig.url);
const linkClass = "touch-target text-accent underline-offset-4 transition-colors hover:underline";

function ProjectLinks({ links }: { links: ProjectLink[] }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2 text-[0.8125rem]">
      {links.map((link) => {
        const key = `${link.label}-${link.href}`;
        const target = resolveProjectLink(link.href);

        // Router-owned paths keep client-side navigation; everything else is a
        // plain anchor with the shared external-link handling.
        if (target.kind === "post") {
          return (
            <Link key={key} to="/posts/$slug" params={{ slug: target.slug }} className={linkClass}>
              {link.label}
            </Link>
          );
        }

        if (target.kind === "route") {
          return (
            <Link key={key} to={target.to} className={linkClass}>
              {link.label}
            </Link>
          );
        }

        return (
          <a
            key={key}
            href={target.href}
            {...getLinkNavigationProps({ href: target.href })}
            className={linkClass}
          >
            {link.label} <span aria-hidden="true">↗</span>
          </a>
        );
      })}
    </div>
  );
}

function primaryUrl(project: Project): string {
  const link = project.links[0];
  if (!link) return projectsUrl;
  return link.href.startsWith("/") ? absoluteUrl(link.href, siteConfig.url) : link.href;
}

function buildJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: siteConfig.projectsPage.title,
        description: siteConfig.projectsPage.description,
        url: projectsUrl,
        inLanguage: siteConfig.language,
        author: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.author.url },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: projects.length,
          itemListElement: projects.map((project, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "SoftwareApplication",
              name: project.name,
              description: project.description,
              url: primaryUrl(project),
              applicationCategory: project.tags.join(", "),
              author: {
                "@type": "Person",
                name: siteConfig.author.name,
                url: siteConfig.author.url,
              },
            },
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: siteConfig.name,
            item: absoluteUrl(siteConfig.routes.home, siteConfig.url),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: siteConfig.projectsPage.title,
            item: projectsUrl,
          },
        ],
      },
    ],
  };
}

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: `${siteConfig.projectsPage.title} | ${siteConfig.name}` },
      { name: "description", content: siteConfig.projectsPage.description },
      { property: "og:title", content: siteConfig.projectsPage.title },
      { property: "og:description", content: siteConfig.projectsPage.description },
      { property: "og:url", content: projectsUrl },
      { property: "og:image", content: projectsImage },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/png" },
      { name: "twitter:card", content: siteConfig.twitterCard },
      { name: "twitter:title", content: siteConfig.projectsPage.title },
      { name: "twitter:description", content: siteConfig.projectsPage.description },
      { name: "twitter:image", content: projectsImage },
    ],
    links: [{ rel: "canonical", href: projectsUrl }],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJsonLd()).replaceAll("<", "\\u003c"),
        }}
      />
      <header>
        <h1 className="page-title">{siteConfig.projectsPage.heading}</h1>
        <p className="mt-3 text-[0.9375rem] text-muted">{siteConfig.projectsPage.intro}</p>
      </header>
      <ul className="mt-10 space-y-9">
        {projects.map((project) => (
          <li key={project.name} id={projectSlug(project.name)} className="scroll-mt-24">
            <article>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-[1.0625rem] font-medium tracking-tight">{project.name}</h2>
                <p className="font-mono text-xs text-muted">{project.tags.join(" · ")}</p>
              </div>
              <p className="mt-1.5 text-[0.9375rem] leading-7 text-muted">{project.description}</p>
              <ProjectLinks links={project.links} />
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}

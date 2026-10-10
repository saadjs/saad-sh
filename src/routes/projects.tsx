import { createFileRoute, Link } from "@tanstack/react-router";
import {
  projects,
  projectSlug,
  resolveProjectLink,
  type Project,
  type ProjectLink,
} from "#/lib/projects";
import { siteConfig } from "#/site.config";
import { HandNote, MarkedTitle } from "#/components/Sketch";
import { getLinkNavigationProps } from "#/lib/links";
import { absoluteUrl, ogImagePath } from "#/lib/utils";

const projectsUrl = absoluteUrl(siteConfig.routes.projects, siteConfig.url);
const projectsImage = absoluteUrl(ogImagePath(), siteConfig.url);
const linkClass = "pen-link inline-flex min-h-11 items-center";
// Each taped note sits slightly off-square, like it was stuck on by hand.
const noteTilts = [
  "-rotate-[0.6deg] sketch-box-alt",
  "rotate-[0.5deg]",
  "rotate-[0.4deg] sketch-box-alt",
  "-rotate-[0.5deg]",
];
const tapeSpots = [
  "left-[38%] -rotate-3",
  "left-[42%] rotate-2",
  "left-[36%] rotate-3",
  "left-[44%] -rotate-2",
];

function ProjectLinks({ links }: { links: ProjectLink[] }) {
  return (
    <div className="mt-auto flex flex-wrap gap-x-[1.125rem] text-[0.9375rem]">
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
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
          <MarkedTitle text={siteConfig.projectsPage.heading} />
          <HandNote arrow="down-left" tilt="-rotate-[4deg]" className="pb-2 text-[1.625rem]">
            {siteConfig.projectsPage.countNote(projects.length)}
          </HandNote>
        </div>
        <p className="mt-3.5 max-w-[32.5rem]">{siteConfig.projectsPage.intro}</p>
      </header>
      {/* The notes break out of the reading column once there is room for it. */}
      <ul className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,19rem),1fr))] gap-x-7 gap-y-9 lg:-mx-20">
        {projects.map((project, index) => (
          <li key={project.name} id={projectSlug(project.name)} className="flex scroll-mt-24">
            <article
              className={`sketch-box relative flex w-full flex-col gap-2 px-5 pt-6 pb-3 ${noteTilts[index % noteTilts.length]}`}
            >
              <span
                aria-hidden="true"
                className={`absolute -top-3 h-[1.375rem] w-[5.25rem] bg-[#ffe14d]/75 ${tapeSpots[index % tapeSpots.length]}`}
              />
              <h2 className="text-2xl leading-tight font-semibold tracking-[-0.03em]">
                {project.name}
              </h2>
              <p className="text-[0.9375rem] leading-relaxed">{project.description}</p>
              <p className="font-mono text-xs text-muted">
                {project.tags.join(" · ").toLowerCase()}
              </p>
              <ProjectLinks links={project.links} />
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
const projectsImage = absoluteUrl(ogImagePath("projects"), siteConfig.url);
const linkClass = "text-accent transition-colors hover:underline";

function ProjectLinks({ links }: { links: ProjectLink[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
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
            {link.label}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />
      <section>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          {siteConfig.projectsPage.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          {siteConfig.projectsPage.heading}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">{siteConfig.projectsPage.intro}</p>
      </section>

      <ol className="mt-10 divide-y divide-border">
        {projects.map((project, index) => (
          <li
            key={project.name}
            id={projectSlug(project.name)}
            className="grid gap-4 py-7 scroll-mt-24 md:grid-cols-[4rem_1fr]"
          >
            <div aria-hidden="true" className="font-mono text-sm text-faint">
              {String(index + 1).padStart(2, "0")}
            </div>
            <article>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {project.name}
              </h2>
              <p className="mt-2 text-muted">{project.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <ProjectLinks links={project.links} />
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}

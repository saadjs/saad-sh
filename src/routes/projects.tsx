import { createFileRoute } from "@tanstack/react-router";
import { projects, type ProjectLink } from "#/lib/projects";
import { siteConfig } from "#/site.config";
import { absoluteUrl } from "#/lib/utils";

function isExternalLink(href: string) {
  return href.startsWith("http");
}

function ProjectLinks({ links }: { links: ProjectLink[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {links.map((link) => {
        const external = isExternalLink(link.href);

        return (
          <a
            key={`${link.label}-${link.href}`}
            href={link.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className="text-accent transition-colors hover:underline"
          >
            {link.label}
          </a>
        );
      })}
    </div>
  );
}

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: `${siteConfig.projectsPage.title} | ${siteConfig.name}` },
      { name: "description", content: siteConfig.projectsPage.description },
      { property: "og:title", content: siteConfig.projectsPage.title },
      { property: "og:description", content: siteConfig.projectsPage.description },
      { property: "og:url", content: `${siteConfig.url}${siteConfig.routes.projects}` },
      { name: "twitter:title", content: siteConfig.projectsPage.title },
      { name: "twitter:description", content: siteConfig.projectsPage.description },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(siteConfig.routes.projects, siteConfig.url) }],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <div>
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
          <li key={project.name} className="grid gap-4 py-7 md:grid-cols-[4rem_1fr]">
            <div className="font-mono text-sm text-faint">{String(index + 1).padStart(2, "0")}</div>
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

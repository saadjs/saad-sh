import { Link } from "@tanstack/react-router";
import { resolveProjectLink, type ProjectLink } from "#/lib/projects";
import { getLinkNavigationProps } from "#/lib/links";
import type { ProjectCardProps } from "#/styles/types";

/** A project's links, with router navigation for the site's own pages. */
export function ProjectLinks({ links, className }: { links: ProjectLink[]; className?: string }) {
  const linkClass = className ?? "ui-link";
  return (
    <div className="project-links">
      {links.map((link) => {
        const key = `${link.label}-${link.href}`;
        const target = resolveProjectLink(link.href);

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

/** The card used by any style that does not bring its own. */
export function DefaultProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="project-card ui-panel">
      <h2 className="project-name">{project.name}</h2>
      <p className="project-desc">{project.description}</p>
      <p className="project-tags">{project.tags.join(" · ").toLowerCase()}</p>
      <ProjectLinks links={project.links} />
    </article>
  );
}

import { Link, useRouteContext } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";

const linkClass = "inline-flex min-h-11 items-center transition-colors hover:text-accent";

export function Footer() {
  const { features } = useRouteContext({ from: "__root__" });
  return (
    <footer className="sketch-rule mt-16 flex flex-wrap items-center justify-between gap-x-6 pt-3 text-sm text-muted">
      <p>{siteConfig.footer.description}</p>
      <div className="flex flex-wrap gap-x-[1.375rem]">
        {features.newsletter && (
          <Link to="/newsletter" className={linkClass}>
            Newsletter
          </Link>
        )}
        <Link to={siteConfig.routes.feed} className={linkClass} reloadDocument>
          {siteConfig.footer.links.feed}
        </Link>
        <a href={siteConfig.author.github} target="_blank" rel="noreferrer" className={linkClass}>
          {siteConfig.footer.links.github}
        </a>
      </div>
    </footer>
  );
}

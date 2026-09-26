import { Link, useRouteContext } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";

const linkClass =
  "touch-target underline-offset-4 transition-colors hover:text-foreground hover:underline";

export function Footer() {
  const { features } = useRouteContext({ from: "__root__" });
  return (
    <footer className="mt-16 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs text-muted">
      <p>{siteConfig.footer.description}</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
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

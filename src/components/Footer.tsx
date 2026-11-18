import { Link, useRouteContext } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";
import { terminalHash, terminalOpenEvent } from "./TerminalClient";

export function Footer() {
  // The context is missing only if the root loader failed; the footer still renders.
  const features = useRouteContext({ from: "__root__" })?.features;
  return (
    <footer className="site-footer">
      <p>{siteConfig.footer.description}</p>
      <nav aria-label="Elsewhere">
        {features?.newsletter && <Link to="/newsletter">Newsletter</Link>}
        <Link to={siteConfig.routes.feed} reloadDocument>
          {siteConfig.footer.links.feed}
        </Link>
        {/* A real link, so `/#terminal` opens it too and every style dresses it
            like its neighbours. */}
        <a
          href={`#${terminalHash}`}
          onClick={(event) => {
            event.preventDefault();
            window.dispatchEvent(new Event(terminalOpenEvent));
          }}
        >
          {siteConfig.terminal.footerLink}
        </a>
        <a href={siteConfig.author.github} target="_blank" rel="noreferrer">
          {siteConfig.footer.links.github}
        </a>
        <a href={siteConfig.author.linkedin} target="_blank" rel="noreferrer">
          {siteConfig.footer.links.linkedin}
        </a>
      </nav>
    </footer>
  );
}

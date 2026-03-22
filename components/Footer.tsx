import Link from "next/link";
import { siteConfig } from "@/site.config";
import { RssIcon, CodeIcon, GitHubIcon, LinkedInIcon } from "@/components";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border pt-8 pb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-faint">
          &copy; {new Date().getFullYear()} {siteConfig.footer.copyrightOwner}
        </p>
        <div className="flex gap-3 text-muted">
          <Link
            href={siteConfig.routes.feed}
            aria-label={siteConfig.footer.links.feed}
            className="transition-colors hover:text-foreground"
          >
            <RssIcon className="h-4 w-4" />
          </Link>
          <a
            href={siteConfig.github.sourceUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={siteConfig.footer.links.source}
            className="transition-colors hover:text-foreground"
          >
            <CodeIcon className="h-4 w-4" />
          </a>
          <a
            href={siteConfig.author.github}
            target="_blank"
            rel="noreferrer"
            aria-label={siteConfig.footer.links.github}
            className="transition-colors hover:text-foreground"
          >
            <GitHubIcon className="h-4 w-4" />
          </a>
          <a
            href={siteConfig.author.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label={siteConfig.footer.links.linkedin}
            className="transition-colors hover:text-foreground"
          >
            <LinkedInIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}

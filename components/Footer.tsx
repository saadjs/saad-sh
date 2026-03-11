import Link from "next/link";
import { siteConfig } from "@/site.config";

export function Footer() {
  return (
    <footer className="surface-panel mt-16 rounded-[1.75rem] px-5 py-6 sm:px-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{siteConfig.footer.eyebrow}</p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            {siteConfig.footer.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
          <Link
            href={siteConfig.routes.feed}
            className="rounded-full border border-zinc-200/80 px-3 py-1.5 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            {siteConfig.footer.links.feed}
          </Link>
          <a
            href={siteConfig.author.github}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-zinc-200/80 px-3 py-1.5 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            {siteConfig.footer.links.github}
          </a>
          <a
            href={siteConfig.author.linkedin}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-zinc-200/80 px-3 py-1.5 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
          >
            {siteConfig.footer.links.linkedin}
          </a>
        </div>
      </div>
      <div className="mt-5 border-t border-zinc-200/80 pt-5 dark:border-zinc-800">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
          &copy; {new Date().getFullYear()} {siteConfig.footer.copyrightOwner}.{" "}
          {siteConfig.footer.copyrightSuffix}
        </p>
      </div>
    </footer>
  );
}

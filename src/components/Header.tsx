import { Link, useRouterState } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";
import { SearchButton } from "./SearchButton";

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="mb-11 sm:mb-[3.375rem]">
      <nav
        aria-label="Main navigation"
        className="flex flex-wrap items-center justify-between gap-x-7 gap-y-5"
      >
        <Link
          to="/"
          aria-label={`${siteConfig.name} home`}
          className="flex shrink-0 items-center gap-3.5 font-mono text-lg font-medium tracking-[-0.05em] text-foreground"
        >
          <span className="size-2.5 bg-accent" aria-hidden="true" />
          {siteConfig.name}
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-muted">
          {siteConfig.nav.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === siteConfig.routes.posts &&
                pathname.startsWith(siteConfig.routes.tags));
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={`touch-target underline-offset-4 transition-colors ${
                  active ? "text-foreground underline" : "hover:text-foreground hover:underline"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <SearchButton />
        </div>
      </nav>
    </header>
  );
}

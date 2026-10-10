import { Link, useRouterState } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";
import { logoAccent } from "#/lib/logo";
import { LogoMark } from "./LogoMark";
import { SearchButton } from "./SearchButton";
import { PenCircle } from "./Sketch";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="mb-11">
      <nav
        aria-label="Main navigation"
        className="flex flex-wrap items-center justify-between gap-x-7 gap-y-2"
      >
        <Link
          to="/"
          aria-label={`${siteConfig.name} home`}
          className="flex min-h-11 shrink-0 items-center gap-3 font-mono text-lg tracking-[-0.04em] text-foreground"
        >
          <LogoMark className="size-[1.375rem]" style={{ color: logoAccent }} />
          {siteConfig.name}
        </Link>
        <div className="flex flex-wrap items-center gap-x-[1.625rem] text-[0.9375rem]">
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
                className="relative inline-flex min-h-11 items-center transition-colors hover:text-accent"
              >
                {item.label}
                {active && <PenCircle />}
              </Link>
            );
          })}
          <SearchButton />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

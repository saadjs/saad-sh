import { Link, useRouterState } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";
import { LogoMark } from "./LogoMark";
import { SearchButton } from "./SearchButton";

// "saad.sh" -> ["saad", ".sh"], so the suffix can carry the accent.
const dot = siteConfig.name.indexOf(".");
const nameStem = siteConfig.name.slice(0, dot);
const nameSuffix = siteConfig.name.slice(dot);

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="mb-14">
      <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="wordmark flex shrink-0 items-center gap-2.5 text-lg tracking-tight text-foreground"
          >
            <LogoMark width={22} height={22} />
            <span>
              {nameStem}
              <span className="text-accent">{nameSuffix}</span>
              <span className="caret" aria-hidden="true" />
            </span>
          </Link>
          <div className="sm:hidden">
            <SearchButton />
          </div>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <div className="hidden sm:block">
            <SearchButton />
          </div>
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`transition-colors ${
                pathname === item.href ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";
import { SearchButton } from "./SearchButton";

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="mb-14">
      <nav className="flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground"
        >
          <img src="/logo.svg" alt="" width={22} height={22} />
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <SearchButton />
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

import { Link, useRouterState } from "@tanstack/react-router";
import { siteConfig } from "#/site.config";
import { logoAccent } from "#/lib/logo";
import { useStyle } from "#/styles/use-style";
import { LogoMark } from "./LogoMark";
import { SearchButton } from "./SearchButton";
import { StyleSwitcher } from "./StyleSwitcher";
import { ThemeToggle } from "./ThemeToggle";

const dot = siteConfig.name.lastIndexOf(".");
const brandName = dot === -1 ? siteConfig.name : siteConfig.name.slice(0, dot);
const brandSuffix = dot === -1 ? "" : siteConfig.name.slice(dot);

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const style = useStyle();
  // A style may rename the nav items (Arcade calls posts "Quests").
  const labels: Record<string, string | undefined> = {
    [siteConfig.routes.posts]: style.nav?.posts,
    [siteConfig.routes.projects]: style.nav?.projects,
    [siteConfig.routes.about]: style.nav?.about,
  };

  return (
    <header className="site-header">
      <Link
        to="/"
        aria-label={`${siteConfig.name} home`}
        className="site-brand"
        // The logo colour has one source (logo.ts); CSS can still override the mark.
        style={{ "--logo-accent": logoAccent } as React.CSSProperties}
      >
        <LogoMark className="site-brand-mark" />
        <span>
          {brandName}
          <span className="site-brand-suffix">{brandSuffix}</span>
        </span>
      </Link>
      <nav aria-label="Main navigation" className="site-nav">
        {siteConfig.nav.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (item.href === siteConfig.routes.posts && pathname.startsWith(siteConfig.routes.tags));
          return (
            <Link key={item.href} to={item.href} aria-current={active ? "page" : undefined}>
              {labels[item.href] ?? item.label}
            </Link>
          );
        })}
      </nav>
      <div className="site-tools">
        <SearchButton />
        <StyleSwitcher />
        {style.themes === "both" && <ThemeToggle />}
      </div>
    </header>
  );
}

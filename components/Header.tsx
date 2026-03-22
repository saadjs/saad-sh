"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/site.config";
import { SearchButton } from "./SearchButton";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="mb-14">
      <nav className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground"
        >
          <Image src="/logo.svg" alt="" width={22} height={22} />
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <SearchButton />
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
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

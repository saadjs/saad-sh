import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/site.config";
import { SearchButton } from "./SearchButton";

export function Header() {
  return (
    <header className="mb-16">
      <nav className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-lg font-semibold tracking-[-0.04em] text-zinc-900 dark:text-zinc-100"
        >
          <Image src="/logo.svg" alt="" width={24} height={24} />
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-4 font-mono text-sm uppercase tracking-[0.14em]">
          <SearchButton />
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

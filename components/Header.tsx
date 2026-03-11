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
      <nav className="surface-panel flex flex-col gap-5 rounded-2xl px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <Link
          href="/"
          className="flex items-center gap-3 font-mono text-lg font-semibold tracking-[-0.04em] text-zinc-900 transition-transform hover:-translate-y-0.5 dark:text-zinc-100"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/80">
            <Image src="/logo.svg" alt="" width={22} height={22} />
          </span>
          <span className="flex flex-col leading-none">
            <span>{siteConfig.name}</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500">
              {siteConfig.header.tagline}
            </span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-3 font-mono text-sm uppercase tracking-[0.14em]">
          <SearchButton />
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`rounded-full border px-3 py-1.5 transition-colors ${
                pathname === item.href
                  ? "border-orange-300 bg-orange-50 text-zinc-900 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-zinc-100"
                  : "border-zinc-200/80 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
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

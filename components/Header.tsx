"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/site.config";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="mb-16">
      <nav className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          <Image src="/logo.svg" alt="" width={24} height={24} />
          {siteConfig.name}
        </Link>
        <div className="flex gap-6 text-sm">
          {siteConfig.nav.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

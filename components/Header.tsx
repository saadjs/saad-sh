import Link from "next/link";
import { siteConfig } from "@/site.config";

export function Header() {
  return (
    <header className="mb-16">
      <nav className="flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {siteConfig.name}
        </Link>
        <div className="flex gap-6 text-sm">
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

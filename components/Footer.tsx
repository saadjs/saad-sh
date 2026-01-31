import { siteConfig } from "@/site.config";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        &copy; {new Date().getFullYear()} {siteConfig.footer.copyrightOwner}.{" "}
        {siteConfig.footer.copyrightSuffix}
      </p>
    </footer>
  );
}

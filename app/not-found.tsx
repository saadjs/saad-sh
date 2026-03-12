import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <section className="surface-panel rounded-[1.75rem] px-6 py-10 text-center sm:px-12">
        <p className="eyebrow">404</p>
        <h1 className="section-title mt-4 text-3xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          Back to home
        </Link>
      </section>
    </div>
  );
}

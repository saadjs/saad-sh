import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <section className="text-center">
        <p className="text-sm text-faint">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="mt-6 inline-block text-accent hover:underline">
          Back to home
        </Link>
      </section>
    </div>
  );
}

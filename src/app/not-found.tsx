import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center">
        <p className="section-label mb-3">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-ink-soft mt-3 text-sm leading-relaxed">
          The page you requested does not exist or may have moved.
        </p>
        <Link href="/" className="btn-primary inline-block mt-7 px-5 py-2.5 rounded-full text-sm font-medium">
          Back to Skill Note
        </Link>
      </div>
    </main>
  );
}

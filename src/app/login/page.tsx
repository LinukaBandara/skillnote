import { login } from "@/app/auth/actions";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">
          ← Skill Note
        </Link>
        <h1 className="stat-serif text-4xl mt-6 mb-1">Welcome back</h1>
        <p className="text-ink-soft mb-8">Sign in to continue your courses.</p>

        {error && (
          <p className="mb-4 text-sm text-red-700 border-l-2 border-red-700 pl-3">
            {error}
          </p>
        )}

        <form action={login} className="space-y-5">
          <div>
            <label className="block text-sm mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-cobalt transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-cobalt transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full btn-primary py-3 rounded-full mt-2 font-medium text-sm"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-soft">
          New to Skill Note?{" "}
          <Link href="/signup" className="text-ink underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

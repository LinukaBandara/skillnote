import { login } from "@/app/auth/actions";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <Logo size={34} />
          <span className="text-base font-bold tracking-tight text-ink">Skill Note</span>
        </Link>

        <div className="auth-card p-8">
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] mb-1">Welcome back</h1>
          <p className="text-ink-soft text-sm mb-7">Sign in to continue your A/L journey.</p>

          {error && (
            <p className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <form action={login} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required className="field" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full btn-primary py-3 rounded-full mt-2 font-medium text-sm">
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-6 text-sm text-ink-soft text-center">
          New to Skill Note?{" "}
          <Link href="/signup" className="text-cobalt font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

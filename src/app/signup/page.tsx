import { signup } from "@/app/auth/actions";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default async function SignupPage({
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
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] mb-1">Create your account</h1>
          <p className="text-ink-soft text-sm mb-7">Track your syllabus, practice, and progress.</p>

          {error && (
            <p className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <form action={signup} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="full_name">Full name</label>
              <input id="full_name" name="full_name" type="text" required className="field" placeholder="Nimesha Perera" />
            </div>
            <div>
              <label className="field-label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required minLength={6} className="field" placeholder="At least 6 characters" />
            </div>
            <button type="submit" className="w-full btn-primary py-3 rounded-full mt-2 font-medium text-sm">
              Create account
            </button>
          </form>
        </div>

        <p className="mt-6 text-sm text-ink-soft text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-cobalt font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { logout } from "@/app/auth/actions";

export default async function NavBar() {
  const profile = await getCurrentProfile();
  const isStaff = profile && profile.role !== "student";

  return (
    <header className="sticky top-0 z-10 bg-bg-warm/80 backdrop-blur-md border-b border-rule">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="stat-serif text-2xl text-ink">SN</span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">Skill Note</span>
        </Link>

        <nav className="flex items-center gap-7 text-sm">
          <Link href="/subjects" className="text-ink-soft hover:text-ink transition-colors">
            Subjects
          </Link>

          {profile ? (
            <>
              <Link href="/dashboard" className="text-ink-soft hover:text-ink transition-colors">
                {isStaff ? "Teacher dashboard" : "My dashboard"}
              </Link>
              {isStaff && (
                <Link href="/admin" className="text-ink-soft hover:text-ink transition-colors">
                  Admin
                </Link>
              )}
              <form action={logout}>
                <button className="text-ink-soft hover:text-ink transition-colors">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-ink-soft hover:text-ink transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="btn-primary px-4 py-2 rounded-full text-sm font-medium"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

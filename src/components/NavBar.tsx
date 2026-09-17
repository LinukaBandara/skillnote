import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { logout } from "@/app/auth/actions";
import { Logo } from "@/components/Logo";

const APP_SHELL_PREFIXES = ["/dashboard", "/admin", "/onboarding", "/practice", "/certificates", "/study-plan", "/notifications"];
const DUAL_PURPOSE_PREFIXES = ["/subjects"];

export default async function NavBar() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (APP_SHELL_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const profile = await getCurrentProfile();

  // Subjects pages are browsable while logged out (top nav) but use the
  // app shell once logged in, so avoid double navigation in that case.
  if (profile && DUAL_PURPOSE_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const isStaff = profile && profile.role !== "student";

  return (
    <header className="sticky top-0 z-10 bg-bg-warm/80 backdrop-blur-md border-b border-rule">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="text-[15px] font-bold tracking-tight text-ink">Skill Note</span>
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

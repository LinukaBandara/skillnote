import Link from "next/link";
import { headers } from "next/headers";

const APP_PREFIXES = ["/dashboard", "/admin", "/onboarding", "/practice", "/certificates", "/study-plan", "/notifications"];

export default async function Footer() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  if (APP_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer className="border-t border-rule mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-faint">
        <p>© {new Date().getFullYear()} Skill Note · <a href="https://ark-ii.studio" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">Built by ARK II</a></p>
        <nav className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
          <a href="mailto:support@skillnote.lk" className="hover:text-ink transition-colors">Support</a>
        </nav>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";

const STUDENT_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/subjects", label: "Subjects", icon: "book" },
  { href: "/practice", label: "Practice", icon: "target" },
  { href: "/study-plan", label: "Study Plan", icon: "calendar" },
  { href: "/certificates", label: "Certificates", icon: "award" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
  { href: "/onboarding", label: "Settings", icon: "settings" },
];

const STAFF_NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "home" },
  { href: "/admin/courses", label: "Courses", icon: "book" },
  { href: "/admin/questions", label: "Questions", icon: "award" },
  { href: "/admin/mock-exams", label: "Mock Exams", icon: "calendar" },
  { href: "/admin/students", label: "Students", icon: "target" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
];

const INSTITUTES_ITEM = { href: "/admin/institutes", label: "Institutes", icon: "settings" };

function Icon({ name }: { name: string }) {
  const common = "w-[18px] h-[18px]";
  switch (name) {
    case "home":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "book":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" strokeLinejoin="round" />
          <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" strokeLinejoin="round" />
        </svg>
      );
    case "target":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="0.5" fill="currentColor" />
        </svg>
      );
    case "award":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="9" r="5" />
          <path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="5.5" width="16" height="15" rx="2" />
          <path d="M4 10h16M8 3.5v3M16 3.5v3" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 13.5c.1-.5.1-1 0-1.5l1.6-1.2-1.5-2.6-1.9.7c-.4-.3-.8-.6-1.3-.8L16 6h-3l-.3 2.1c-.5.2-.9.5-1.3.8l-1.9-.7-1.5 2.6L9.6 12c-.1.5-.1 1 0 1.5l-1.6 1.2 1.5 2.6 1.9-.7c.4.3.8.6 1.3.8L13 20h3l.3-2.1c.5-.2.9-.5 1.3-.8l1.9.7 1.5-2.6-1.6-1.2Z" strokeLinejoin="round" />
        </svg>
      );
    case "bell":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" strokeLinejoin="round" />
          <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export async function DashboardSidebar({
  activeHref,
  isStaff = false,
  showInstitutes = false,
}: {
  activeHref: string;
  isStaff?: boolean;
  showInstitutes?: boolean;
}) {
  const navItems = isStaff ? (showInstitutes ? [...STAFF_NAV_ITEMS, INSTITUTES_ITEM] : STAFF_NAV_ITEMS) : STUDENT_NAV_ITEMS;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let unreadCount = 0;
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);
    unreadCount = count ?? 0;
  }

  return (
    <aside className="hidden md:flex flex-col justify-between w-52 shrink-0 py-7 px-4">
      <div>
        <Link href="/" className="flex items-center gap-2.5 mb-9 px-1">
          <Logo size={30} />
          <span className="text-[15px] font-bold text-ink tracking-tight">Skill Note</span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? "bg-cobalt text-white font-medium"
                    : "text-ink-soft hover:bg-bg-warm hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon name={item.icon} />
                  {item.label}
                </span>
                {item.icon === "bell" && unreadCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isActive ? "bg-white/20" : "bg-butter/40 text-ink"}`}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <div className="rounded-2xl bg-bg-warm p-4 mb-3">
          <p className="text-xs font-medium text-ink mb-1">Need help?</p>
          <p className="text-xs text-ink-faint mb-3 leading-relaxed">
            Have a question about Skill Note?
          </p>
          <a href="mailto:support@skillnote.lk" className="text-xs text-cobalt font-medium">
            Get support →
          </a>
        </div>
        <form action={logout} className="px-1">
          <button className="text-sm text-ink-faint hover:text-ink-soft transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

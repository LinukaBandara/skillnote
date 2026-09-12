import Link from "next/link";
import { logout } from "@/app/auth/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/subjects", label: "Subjects", icon: "book" },
  { href: "/courses", label: "Courses", icon: "grid" },
];

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
    case "grid":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    default:
      return null;
  }
}

export function DashboardSidebar({ activeHref }: { activeHref: string }) {
  return (
    <aside className="hidden md:flex flex-col justify-between w-56 shrink-0 py-8 pr-6">
      <div>
        <Link href="/" className="flex items-center gap-2 mb-10 px-2">
          <span className="stat-serif text-2xl text-ink">SN</span>
          <span className="text-[15px] font-semibold text-ink">Skill Note</span>
        </Link>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? "bg-cobalt text-white font-medium"
                    : "text-ink-soft hover:bg-surface hover:text-ink"
                }`}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <form action={logout} className="px-2">
        <button className="text-sm text-ink-faint hover:text-ink-soft transition-colors">
          Sign out
        </button>
      </form>
    </aside>
  );
}

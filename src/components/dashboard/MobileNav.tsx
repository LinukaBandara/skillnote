import Link from "next/link";

const STUDENT_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/subjects", label: "Subjects", icon: "book" },
  { href: "/practice", label: "Practice", icon: "target" },
  { href: "/study-plan", label: "Plan", icon: "calendar" },
  { href: "/onboarding", label: "Profile", icon: "settings" },
];

const STAFF_ITEMS = [
  { href: "/admin", label: "Overview", icon: "home" },
  { href: "/admin/courses", label: "Courses", icon: "book" },
  { href: "/admin/students", label: "Students", icon: "target" },
];

function Icon({ name }: { name: string }) {
  const common = "w-5 h-5";
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
    default:
      return null;
  }
}

export function MobileNav({ activeHref, isStaff = false }: { activeHref: string; isStaff?: boolean }) {
  const items = isStaff ? STAFF_ITEMS : STUDENT_ITEMS;
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-surface border-t border-rule flex items-stretch">
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] ${
              isActive ? "text-cobalt" : "text-ink-faint"
            }`}
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

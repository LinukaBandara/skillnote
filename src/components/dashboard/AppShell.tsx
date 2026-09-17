import { DashboardSidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppShell({
  activeHref,
  isStaff = false,
  showInstitutes = false,
  children,
}: {
  activeHref: string;
  isStaff?: boolean;
  showInstitutes?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen py-4 px-3 md:py-5 md:px-5 pb-20 md:pb-5">
      <div className="max-w-[1680px] mx-auto shell flex overflow-hidden min-h-[calc(100vh-2.5rem)]">
        <DashboardSidebar activeHref={activeHref} isStaff={isStaff} showInstitutes={showInstitutes} />
        <div className="flex-1 min-w-0 border-l-0 md:border-l border-rule">{children}</div>
      </div>
      <MobileNav activeHref={activeHref} isStaff={isStaff} />
    </div>
  );
}

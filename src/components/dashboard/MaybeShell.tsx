import { AppShell } from "./AppShell";

export function MaybeShell({
  isLoggedIn,
  isStaff = false,
  activeHref,
  children,
}: {
  isLoggedIn: boolean;
  isStaff?: boolean;
  activeHref: string;
  children: React.ReactNode;
}) {
  if (isLoggedIn) {
    return (
      <AppShell activeHref={activeHref} isStaff={isStaff}>
        <div className="max-w-2xl px-6 md:px-8 py-10">{children}</div>
      </AppShell>
    );
  }
  return <div className="max-w-2xl mx-auto px-6 py-20">{children}</div>;
}

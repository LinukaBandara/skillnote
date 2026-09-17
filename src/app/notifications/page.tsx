import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";
import { markAllRead, markRead } from "./actions";

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const isStaff = profile.role !== "student";

  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;

  return (
    <AppShell activeHref="/notifications" isStaff={isStaff} showInstitutes={profile.role !== "teacher" && profile.role !== "student"}>
      <div className="max-w-xl px-6 md:px-8 py-10">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <form action={markAllRead}>
              <button type="submit" className="text-xs text-cobalt border-b border-cobalt/30 hover:border-cobalt pb-0.5">
                Mark all read
              </button>
            </form>
          )}
        </div>
        <p className="text-ink-soft mb-10 text-sm">
          {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
        </p>

        {(notifications ?? []).length === 0 ? (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
            No notifications yet. You&rsquo;ll see updates here when assignments are graded, certificates are earned, or someone replies to your discussions.
          </p>
        ) : (
          <ul className="border-t border-rule">
            {(notifications ?? []).map((n) => (
              <li key={n.id} className={`border-b border-rule py-4 flex items-start gap-3 ${!n.read ? "bg-cobalt/[0.03]" : ""}`}>
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-cobalt" : "bg-transparent"}`} />
                <div className="flex-1">
                  {n.link ? (
                    <Link href={n.link} className="text-sm font-medium hover:text-cobalt transition-colors">
                      {n.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">{n.title}</p>
                  )}
                  {n.body && <p className="text-xs text-ink-soft mt-0.5">{n.body}</p>}
                  <p className="text-xs text-ink-faint mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && (
                  <form action={async () => { "use server"; await markRead(n.id); }}>
                    <button type="submit" className="text-xs text-ink-faint hover:text-ink shrink-0">
                      Mark read
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

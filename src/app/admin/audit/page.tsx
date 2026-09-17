import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";

export default async function AuditLogPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "platform_admin") redirect("/admin");

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, actor_id, institute_id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell activeHref="/admin/audit" isStaff showInstitutes>
      <div className="max-w-6xl px-6 md:px-8 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-faint mb-2">Platform administration</p>
          <h1 className="text-[25px] font-semibold tracking-[-0.025em]">Audit log</h1>
          <p className="text-sm text-ink-soft mt-2">Recent staff operations across the platform.</p>
        </div>

        <div className="border-t border-rule">
          {(logs ?? []).map((log) => (
            <div key={log.id} className="border-b border-rule py-4 grid grid-cols-1 md:grid-cols-[170px_1fr_180px] gap-2 md:gap-6">
              <time className="text-xs text-ink-faint" dateTime={log.created_at}>{new Date(log.created_at).toLocaleString()}</time>
              <div>
                <p className="text-sm font-medium">{log.action}</p>
                <p className="text-xs text-ink-soft mt-1">{log.entity_type}{log.entity_id ? ` · ${log.entity_id}` : ""}</p>
              </div>
              <p className="text-xs text-ink-faint break-all">{log.actor_id ?? "system"}</p>
            </div>
          ))}
          {!logs?.length && <p className="py-8 text-sm text-ink-soft">No audit events recorded yet.</p>}
        </div>
      </div>
    </AppShell>
  );
}

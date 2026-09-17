import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";
import { createInstitute } from "./actions";

export default async function InstitutesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student" || profile.role === "teacher") redirect("/admin");

  // Institute admins manage only their own institute — skip straight there.
  if (profile.role === "institute_admin") {
    if (!profile.institute_id) redirect("/admin");
    redirect(`/admin/institutes/${profile.institute_id}`);
  }

  const supabase = await createClient();
  const { data: institutes } = await supabase
    .from("institutes")
    .select("*, profiles(count)")
    .order("name");

  return (
    <AppShell activeHref="/admin/institutes" isStaff showInstitutes>
      <div className="max-w-xl px-6 md:px-8 py-10">
        <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Institutes</h1>
        <p className="text-ink-soft mb-8 text-sm">Manage tuition institutes on the platform.</p>

        <details className="clay p-6 mb-10">
          <summary className="cursor-pointer text-sm font-medium">+ New institute</summary>
          <form action={createInstitute} className="flex gap-3 mt-5">
            <input
              name="name"
              placeholder="Institute name"
              required
              className="field flex-1"
            />
            <button type="submit" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">
              Create
            </button>
          </form>
        </details>

        {(institutes ?? []).length === 0 ? (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">No institutes yet.</p>
        ) : (
          <ul className="border-t border-rule">
            {(institutes ?? []).map((inst) => (
              <li key={inst.id} className="border-b border-rule">
                <Link href={`/admin/institutes/${inst.id}`} className="flex items-center justify-between py-4 group">
                  <div>
                    <p className="text-sm font-medium group-hover:text-cobalt transition-colors">{inst.name}</p>
                    <p className="text-xs text-ink-faint mt-0.5">{inst.profiles?.[0]?.count ?? 0} members</p>
                  </div>
                  <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">Manage →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

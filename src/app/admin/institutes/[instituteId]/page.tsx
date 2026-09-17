import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";
import { assignMember, removeMember } from "../actions";

export default async function InstituteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ instituteId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { instituteId } = await params;
  const { error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student" || profile.role === "teacher") redirect("/admin");
  if (profile.role === "institute_admin" && profile.institute_id !== instituteId) redirect("/admin");

  const supabase = await createClient();
  const { data: institute } = await supabase.from("institutes").select("*").eq("id", instituteId).single();
  if (!institute) notFound();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("institute_id", instituteId)
    .order("role");

  const canAssignAnyRole = profile.role === "platform_admin";

  return (
    <AppShell activeHref="/admin/institutes" isStaff showInstitutes>
      <div className="max-w-xl px-6 md:px-8 py-10">
        {profile.role === "platform_admin" && (
          <Link href="/admin/institutes" className="text-sm text-ink-soft hover:text-ink">
            ← Institutes
          </Link>
        )}
        <h1 className="text-2xl font-semibold mt-2 mb-1">{institute.name}</h1>
        <p className="text-ink-soft mb-8 text-sm">
          {(members ?? []).length} member{(members ?? []).length === 1 ? "" : "s"}
        </p>

        {error && (
          <p className="mb-6 text-sm text-red-600 border-l-2 border-red-400 pl-3">{error}</p>
        )}

        <details className="clay p-6 mb-10">
          <summary className="cursor-pointer text-sm font-medium">+ Add member</summary>
          <form
            action={async (formData: FormData) => {
              "use server";
              await assignMember(instituteId, formData);
            }}
            className="space-y-4 mt-5"
          >
            <input
              name="email"
              type="email"
              placeholder="Existing account's email"
              required
              className="field"
            />
            {canAssignAnyRole ? (
              <select name="role" defaultValue="teacher" className="field">
                <option value="teacher">Teacher</option>
                <option value="institute_admin">Institute admin</option>
              </select>
            ) : (
              <p className="text-xs text-ink-faint">Will be added as a Teacher.</p>
            )}
            <button type="submit" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">
              Add
            </button>
          </form>
          <p className="text-xs text-ink-faint mt-3">
            The person must already have a Skill Note account (they sign up normally first) — this links their existing account to the institute.
          </p>
        </details>

        {(members ?? []).length === 0 ? (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">No members yet.</p>
        ) : (
          <ul className="border-t border-rule">
            {(members ?? []).map((m) => (
              <li key={m.id} className="border-b border-rule py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm">{m.full_name ?? m.email}</p>
                  <p className="text-xs text-ink-faint capitalize">{m.role.replace("_", " ")}</p>
                </div>
                {m.role !== "institute_admin" || canAssignAnyRole ? (
                  <form action={async () => { "use server"; await removeMember(instituteId, m.id); }}>
                    <button type="submit" className="text-xs text-ink-faint hover:text-red-500">
                      Remove
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

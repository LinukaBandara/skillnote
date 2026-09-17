import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";

export default async function TeacherWorkspacePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const isPlatformAdmin = profile.role === "platform_admin";

  const { data: assignments } = await supabase
    .from("course_teachers")
    .select("course_id, assignment_role")
    .eq("teacher_id", profile.id);

  const courseIds = (assignments ?? []).map((item) => item.course_id);
  const { data: courses } = courseIds.length
    ? await supabase
        .from("courses")
        .select("id, title, description, published, institute_id")
        .in("id", courseIds)
        .order("title")
    : { data: [] };

  const { data: classes } = profile.institute_id
    ? await supabase
        .from("institute_classes")
        .select("id, name, academic_year, al_year")
        .eq("institute_id", profile.institute_id)
        .order("name")
    : { data: [] };

  const { count: assignmentCount } = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("created_by", profile.id);

  return (
    <AppShell activeHref="/teacher" isStaff showInstitutes={isPlatformAdmin}>
      <div className="max-w-5xl px-6 md:px-8 py-10">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-faint mb-2">Teacher workspace</p>
          <h1 className="text-[25px] font-semibold tracking-[-0.025em]">Welcome, {profile.full_name?.split(" ")[0] ?? "Teacher"}</h1>
          <p className="text-sm text-ink-soft mt-2">Manage your teaching workload, classes and assigned courses from one place.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <div className="border border-rule rounded-xl p-5 bg-surface"><p className="text-xs text-ink-soft">Assigned courses</p><p className="text-2xl font-semibold mt-2">{courses?.length ?? 0}</p></div>
          <div className="border border-rule rounded-xl p-5 bg-surface"><p className="text-xs text-ink-soft">Institute classes</p><p className="text-2xl font-semibold mt-2">{classes?.length ?? 0}</p></div>
          <div className="border border-rule rounded-xl p-5 bg-surface"><p className="text-xs text-ink-soft">Assignments created</p><p className="text-2xl font-semibold mt-2">{assignmentCount ?? 0}</p></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <div className="flex items-center justify-between mb-4"><h2 className="font-semibold">My courses</h2><Link href="/admin/courses" className="text-sm text-cobalt">Course builder</Link></div>
            <div className="border-t border-rule">
              {(courses ?? []).map((course) => {
                const role = assignments?.find((item) => item.course_id === course.id)?.assignment_role ?? "teacher";
                return <div key={course.id} className="border-b border-rule py-4 flex items-center justify-between gap-4"><div><p className="font-medium">{course.title}</p><p className="text-xs text-ink-soft mt-1">{role} · {course.published ? "Published" : "Draft"}</p></div><Link href={`/courses/${course.id}`} className="text-sm text-ink-soft hover:text-cobalt">Open</Link></div>;
              })}
              {!courses?.length && <p className="py-6 text-sm text-ink-soft">No courses are assigned to you yet.</p>}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4"><h2 className="font-semibold">Classes</h2><Link href="/admin/institutes" className="text-sm text-cobalt">Institute management</Link></div>
            <div className="border-t border-rule">
              {(classes ?? []).map((item) => <div key={item.id} className="border-b border-rule py-4"><p className="font-medium">{item.name}</p><p className="text-xs text-ink-soft mt-1">{item.al_year ? `A/L Year ${item.al_year}` : "A/L class"}{item.academic_year ? ` · ${item.academic_year}` : ""}</p></div>)}
              {!classes?.length && <p className="py-6 text-sm text-ink-soft">No institute classes are available.</p>}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

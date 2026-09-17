import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";
import { createAssignment } from "./actions";

export default async function CourseAssignmentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("id, title").eq("id", courseId).single();
  if (!course) notFound();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("*, assignment_submissions(count)")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  return (
    <AppShell activeHref="/admin/courses" isStaff showInstitutes={profile.role !== "teacher"}>
      <div className="max-w-xl px-6 md:px-8 py-10">
        <Link href={`/admin/courses/${courseId}`} className="text-sm text-ink-soft hover:text-ink">
          ← {course.title}
        </Link>
        <h1 className="text-2xl font-semibold mt-4 mb-1">Assignments</h1>
        <p className="text-ink-soft mb-10 text-sm">Create assignments and review submissions.</p>

        <details className="clay p-6 mb-10">
          <summary className="cursor-pointer text-sm font-medium">+ New assignment</summary>
          <form
            action={async (formData: FormData) => {
              "use server";
              await createAssignment(courseId, formData);
            }}
            className="space-y-4 mt-5"
          >
            <input
              name="title"
              placeholder="Assignment title"
              required
              className="field"
            />
            <textarea
              name="instructions"
              placeholder="Instructions"
              rows={3}
              className="field resize-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="datetime-local"
                name="due_date"
                className="field"
              />
              <input
                type="number"
                name="max_marks"
                placeholder="Max marks"
                defaultValue={100}
                className="field"
              />
            </div>
            <button type="submit" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">
              Create assignment
            </button>
          </form>
        </details>

        {(assignments ?? []).length === 0 ? (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
            No assignments yet.
          </p>
        ) : (
          <ul className="border-t border-rule">
            {(assignments ?? []).map((a) => (
              <li key={a.id} className="border-b border-rule">
                <Link
                  href={`/admin/courses/${courseId}/assignments/${a.id}`}
                  className="flex items-center justify-between py-4 group"
                >
                  <div>
                    <p className="text-sm font-medium group-hover:text-cobalt transition-colors">{a.title}</p>
                    <p className="text-xs text-ink-faint mt-1">
                      {a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString()}` : "No due date"} ·{" "}
                      {a.assignment_submissions?.[0]?.count ?? 0} submission{a.assignment_submissions?.[0]?.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">Review →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function CourseAssignmentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("id, title").eq("id", courseId).single();
  if (!course) notFound();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("*")
    .eq("course_id", courseId)
    .order("due_date", { ascending: true, nullsFirst: false });

  const { data: submissions } = await supabase
    .from("assignment_submissions")
    .select("assignment_id, grade, graded_at")
    .eq("student_id", profile.id);

  const submissionMap = new Map((submissions ?? []).map((s) => [s.assignment_id, s]));

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href={`/courses/${courseId}`} className="text-sm text-ink-soft hover:text-ink">
        ← {course.title}
      </Link>
      <h1 className="text-[25px] font-semibold tracking-[-0.025em] mt-6 mb-8">Assignments</h1>

      {(assignments ?? []).length === 0 ? (
        <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
          No assignments have been posted for this course yet.
        </p>
      ) : (
        <ul className="border-t border-rule">
          {(assignments ?? []).map((a) => {
            const sub = submissionMap.get(a.id);
            const isOverdue = a.due_date && new Date(a.due_date) < new Date() && !sub;
            return (
              <li key={a.id} className="border-b border-rule">
                <Link href={`/courses/${courseId}/assignments/${a.id}`} className="flex items-center justify-between py-4 group">
                  <div>
                    <p className="text-sm font-medium group-hover:text-cobalt transition-colors">{a.title}</p>
                    <p className="text-xs text-ink-faint mt-1">
                      {a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString()}` : "No due date"}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${
                    sub?.graded_at ? "text-sage" : sub ? "text-cobalt" : isOverdue ? "text-red-500" : "text-ink-faint"
                  }`}>
                    {sub?.graded_at ? `${sub.grade}/${a.max_marks}` : sub ? "Submitted" : isOverdue ? "Overdue" : "Not submitted"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

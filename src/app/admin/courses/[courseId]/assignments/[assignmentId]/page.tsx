import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";
import { gradeSubmission } from "../actions";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const { courseId, assignmentId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const { data: assignment } = await supabase.from("assignments").select("*").eq("id", assignmentId).single();
  if (!assignment) notFound();

  const { data: submissions } = await supabase
    .from("assignment_submissions")
    .select("*, profiles(full_name, email)")
    .eq("assignment_id", assignmentId)
    .order("submitted_at", { ascending: false });

  const submissionsWithUrls = await Promise.all(
    (submissions ?? []).map(async (s) => {
      let fileUrl: string | null = null;
      if (s.file_path) {
        const { data } = await supabase.storage
          .from("assignment-files")
          .createSignedUrl(s.file_path, 60 * 60);
        fileUrl = data?.signedUrl ?? null;
      }
      return { ...s, fileUrl };
    })
  );

  return (
    <AppShell activeHref="/admin/courses" isStaff showInstitutes={profile.role !== "teacher"}>
      <div className="max-w-xl px-6 md:px-8 py-10">
        <Link href={`/admin/courses/${courseId}/assignments`} className="text-sm text-ink-soft hover:text-ink">
          ← Assignments
        </Link>
        <h1 className="text-2xl font-semibold mt-4 mb-1">{assignment.title}</h1>
        <p className="text-ink-soft mb-10 text-sm">
          {submissionsWithUrls.length} submission{submissionsWithUrls.length === 1 ? "" : "s"} · out of {assignment.max_marks} marks
        </p>

        {submissionsWithUrls.length === 0 ? (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">No submissions yet.</p>
        ) : (
          <div className="space-y-5">
            {submissionsWithUrls.map((s) => (
              <div key={s.id} className="clay p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">{s.profiles?.full_name ?? s.profiles?.email}</p>
                    <p className="text-xs text-ink-faint">
                      Submitted {new Date(s.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  {s.grade !== null && (
                    <span className="text-sm text-sage font-medium">{s.grade}/{assignment.max_marks}</span>
                  )}
                </div>

                {s.note && <p className="text-sm text-ink-soft mb-3">{s.note}</p>}

                {s.fileUrl && (
                  <a href={s.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-cobalt underline mb-4 inline-block">
                    {s.file_name ?? "Download file"}
                  </a>
                )}

                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await gradeSubmission(s.id, courseId, assignmentId, formData);
                  }}
                  className="flex items-end gap-3 mt-3 pt-4 border-t border-rule"
                >
                  <div className="flex-1">
                    <label className="block text-xs text-ink-faint mb-1">Grade (out of {assignment.max_marks})</label>
                    <input
                      type="number"
                      name="grade"
                      defaultValue={s.grade ?? ""}
                      max={assignment.max_marks}
                      className="field"
                    />
                  </div>
                  <div className="flex-[2]">
                    <label className="block text-xs text-ink-faint mb-1">Feedback</label>
                    <input
                      name="feedback"
                      defaultValue={s.feedback ?? ""}
                      className="field"
                    />
                  </div>
                  <button type="submit" className="btn-primary px-4 py-2 rounded-full text-xs font-medium shrink-0">
                    {s.graded_at ? "Update" : "Grade"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

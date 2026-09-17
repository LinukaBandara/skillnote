import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { submitAssignment } from "../actions";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const { courseId, assignmentId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: assignment } = await supabase.from("assignments").select("*").eq("id", assignmentId).single();
  if (!assignment) notFound();

  const { data: submission } = await supabase
    .from("assignment_submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("student_id", profile.id)
    .maybeSingle();

  let fileUrl: string | null = null;
  if (submission?.file_path) {
    const { data } = await supabase.storage
      .from("assignment-files")
      .createSignedUrl(submission.file_path, 60 * 60);
    fileUrl = data?.signedUrl ?? null;
  }

  const isGraded = !!submission?.graded_at;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href={`/courses/${courseId}/assignments`} className="text-sm text-ink-soft hover:text-ink">
        ← Assignments
      </Link>
      <h1 className="text-[25px] font-semibold tracking-[-0.025em] mt-6 mb-1">{assignment.title}</h1>
      <p className="text-ink-soft text-sm mb-2">
        {assignment.due_date ? `Due ${new Date(assignment.due_date).toLocaleString()}` : "No due date"} · {assignment.max_marks} marks
      </p>
      {assignment.instructions && (
        <p className="text-sm text-ink-soft whitespace-pre-wrap mt-4 mb-10">{assignment.instructions}</p>
      )}

      {isGraded && (
        <div className="clay p-6 mb-8">
          <p className="text-sm font-medium mb-1">Grade: {submission.grade}/{assignment.max_marks}</p>
          {submission.feedback && <p className="text-sm text-ink-soft mt-2">{submission.feedback}</p>}
        </div>
      )}

      {submission && (
        <div className="mb-6 text-sm text-ink-soft">
          <p>Submitted {new Date(submission.submitted_at).toLocaleString()}</p>
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noreferrer" className="text-cobalt underline text-xs">
              {submission.file_name ?? "View submitted file"}
            </a>
          )}
        </div>
      )}

      {!isGraded && (
        <form
          action={async (formData: FormData) => {
            "use server";
            await submitAssignment(assignmentId, courseId, formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm mb-1.5">
              {submission ? "Resubmit file" : "Upload your submission"}
            </label>
            <input
              type="file"
              name="file"
              className="text-sm w-full"
            />
          </div>
          <textarea
            name="note"
            placeholder="Note (optional)"
            defaultValue={submission?.note ?? ""}
            rows={2}
            className="field resize-none"
          />
          <button type="submit" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">
            {submission ? "Update submission" : "Submit"}
          </button>
        </form>
      )}
    </div>
  );
}

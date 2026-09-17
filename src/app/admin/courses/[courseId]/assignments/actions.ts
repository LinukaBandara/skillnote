"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireStaff() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");
  return profile;
}

export async function createAssignment(courseId: string, formData: FormData) {
  const profile = await requireStaff();
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const instructions = formData.get("instructions") as string;
  const dueDate = (formData.get("due_date") as string) || null;
  const maxMarks = Number(formData.get("max_marks")) || 100;

  await supabase.from("assignments").insert({
    course_id: courseId,
    title,
    instructions,
    due_date: dueDate ? new Date(dueDate).toISOString() : null,
    max_marks: maxMarks,
    created_by: profile.id,
  });

  revalidatePath(`/admin/courses/${courseId}/assignments`);
}

export async function gradeSubmission(
  submissionId: string,
  courseId: string,
  assignmentId: string,
  formData: FormData
) {
  const profile = await requireStaff();
  const supabase = await createClient();

  const grade = Number(formData.get("grade"));
  const feedback = formData.get("feedback") as string;

  const { data: submission } = await supabase
    .from("assignment_submissions")
    .update({
      grade,
      feedback,
      graded_at: new Date().toISOString(),
      graded_by: profile.id,
    })
    .eq("id", submissionId)
    .select("student_id")
    .single();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("title, max_marks")
    .eq("id", assignmentId)
    .single();

  if (submission && assignment) {
    await supabase.rpc("create_notification", {
      target_user: submission.student_id,
      n_type: "assignment_graded",
      n_title: "Assignment graded",
      n_body: `${assignment.title}: ${grade}/${assignment.max_marks}`,
      n_link: `/courses/${courseId}/assignments/${assignmentId}`,
    });
  }

  revalidatePath(`/admin/courses/${courseId}/assignments/${assignmentId}`);
}

export async function getSignedFileUrl(filePath: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("assignment-files")
    .createSignedUrl(filePath, 60 * 60);
  return data?.signedUrl ?? null;
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireStaffForCourse(courseId: string) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, institute_id")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) redirect("/dashboard");

  if (profile.role === "platform_admin") return { profile, course };

  if (profile.role === "institute_admin") {
    if (!profile.institute_id || course.institute_id !== profile.institute_id) {
      redirect("/dashboard");
    }
    return { profile, course };
  }

  if (profile.role === "teacher") {
    const { data: assignment, error } = await supabase
      .from("course_teachers")
      .select("id")
      .eq("course_id", courseId)
      .eq("teacher_id", profile.id)
      .maybeSingle();

    if (error || !assignment) redirect("/dashboard");
    return { profile, course };
  }

  redirect("/dashboard");
}

export async function createAssignment(courseId: string, formData: FormData) {
  const { profile } = await requireStaffForCourse(courseId);
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "assignment_create", 30, 3600);

  const title = String(formData.get("title") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const dueDateInput = String(formData.get("due_date") ?? "").trim();
  const maxMarks = Number(formData.get("max_marks"));

  if (!title || title.length > 200) throw new Error("Assignment title is required and must be 200 characters or fewer.");
  if (instructions.length > 10000) throw new Error("Assignment instructions are too long.");
  if (!Number.isFinite(maxMarks) || !Number.isInteger(maxMarks) || maxMarks < 1 || maxMarks > 10000) {
    throw new Error("Maximum marks must be a whole number between 1 and 10,000.");
  }

  let dueDate: string | null = null;
  if (dueDateInput) {
    const parsed = new Date(dueDateInput);
    if (Number.isNaN(parsed.getTime())) throw new Error("Invalid due date.");
    dueDate = parsed.toISOString();
  }

  const { error } = await supabase.from("assignments").insert({
    course_id: courseId,
    title,
    instructions: instructions || null,
    due_date: dueDate,
    max_marks: maxMarks,
    created_by: profile.id,
  });

  if (error) throw new Error("Unable to create the assignment.");
  revalidatePath(`/admin/courses/${courseId}/assignments`);
}

export async function gradeSubmission(
  submissionId: string,
  courseId: string,
  assignmentId: string,
  formData: FormData
) {
  const { profile } = await requireStaffForCourse(courseId);
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "assignment_grade", 100, 3600);

  const grade = Number(formData.get("grade"));
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!Number.isFinite(grade) || !Number.isInteger(grade) || grade < 0) {
    throw new Error("Grade must be a non-negative whole number.");
  }
  if (feedback.length > 10000) throw new Error("Feedback is too long.");

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id, title, max_marks")
    .eq("id", assignmentId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (assignmentError || !assignment) throw new Error("Assignment not found.");
  if (grade > assignment.max_marks) throw new Error("Grade cannot exceed the assignment maximum marks.");

  const { data: submission, error: submissionError } = await supabase
    .from("assignment_submissions")
    .update({
      grade,
      feedback: feedback || null,
      graded_at: new Date().toISOString(),
      graded_by: profile.id,
    })
    .eq("id", submissionId)
    .eq("assignment_id", assignmentId)
    .select("student_id")
    .maybeSingle();

  if (submissionError || !submission) throw new Error("Submission not found.");

  const { error: notificationError } = await supabase.rpc("create_notification", {
    target_user: submission.student_id,
    n_type: "assignment_graded",
    n_title: "Assignment graded",
    n_body: `${assignment.title}: ${grade}/${assignment.max_marks}`,
    n_link: `/courses/${courseId}/assignments/${assignmentId}`,
  });

  if (notificationError) console.error("Assignment grade notification failed", notificationError);
  revalidatePath(`/admin/courses/${courseId}/assignments/${assignmentId}`);
}

export async function getSignedFileUrl(filePath: string, courseId: string) {
  await requireStaffForCourse(courseId);
  if (!filePath || filePath.length > 500) return null;

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("assignment-files")
    .createSignedUrl(filePath, 60 * 60);
  return data?.signedUrl ?? null;
}

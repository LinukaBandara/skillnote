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

export async function createMockExam(formData: FormData) {
  const profile = await requireStaff();
  const supabase = await createClient();

  const subjectId = formData.get("subject_id") as string;
  const title = formData.get("title") as string;
  const durationMinutes = Number(formData.get("duration_minutes")) || 60;

  const { data: exam } = await supabase
    .from("mock_exams")
    .insert({ subject_id: subjectId, title, duration_minutes: durationMinutes, created_by: profile.id })
    .select()
    .single();

  revalidatePath("/admin/mock-exams");
  if (exam) redirect(`/admin/mock-exams/${exam.id}`);
}

export async function addQuestionToExam(examId: string, questionId: string) {
  await requireStaff();
  const supabase = await createClient();

  const { count } = await supabase
    .from("mock_exam_questions")
    .select("*", { count: "exact", head: true })
    .eq("mock_exam_id", examId);

  await supabase.from("mock_exam_questions").insert({
    mock_exam_id: examId,
    question_id: questionId,
    position: (count ?? 0) + 1,
  });

  revalidatePath(`/admin/mock-exams/${examId}`);
}

export async function removeQuestionFromExam(examId: string, questionId: string) {
  await requireStaff();
  const supabase = await createClient();

  await supabase
    .from("mock_exam_questions")
    .delete()
    .eq("mock_exam_id", examId)
    .eq("question_id", questionId);

  revalidatePath(`/admin/mock-exams/${examId}`);
}

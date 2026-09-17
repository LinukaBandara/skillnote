"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "platform_admin" && profile.role !== "institute_admin") {
    redirect("/dashboard");
  }
  return profile;
}

export async function createMockExam(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const subjectId = String(formData.get("subject_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const rawDuration = Number(formData.get("duration_minutes"));
  const durationMinutes = Number.isInteger(rawDuration) && rawDuration > 0 && rawDuration <= 600 ? rawDuration : 60;
  if (!subjectId || !title) return;

  const { data: exam } = await supabase
    .from("mock_exams")
    .insert({ subject_id: subjectId, title, duration_minutes: durationMinutes, created_by: profile.id })
    .select()
    .single();

  revalidatePath("/admin/mock-exams");
  if (exam) redirect(`/admin/mock-exams/${exam.id}`);
}

export async function addQuestionToExam(examId: string, questionId: string) {
  await requireAdmin();
  if (!examId || !questionId) return;
  const supabase = await createClient();

  const { data: exam } = await supabase.from("mock_exams").select("id, subject_id").eq("id", examId).single();
  const { data: question } = await supabase.from("questions").select("id, subject_id").eq("id", questionId).single();
  if (!exam || !question || exam.subject_id !== question.subject_id) return;

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
  await requireAdmin();
  if (!examId || !questionId) return;
  const supabase = await createClient();

  await supabase
    .from("mock_exam_questions")
    .delete()
    .eq("mock_exam_id", examId)
    .eq("question_id", questionId);

  revalidatePath(`/admin/mock-exams/${examId}`);
}

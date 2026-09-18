"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { enforceRateLimit } from "@/lib/security/rate-limit";
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
  await enforceRateLimit(supabase, profile.id, "admin_mock_exam_create", 30, 3600);

  const subjectId = String(formData.get("subject_id") ?? "").trim().slice(0, 100);
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const rawDuration = Number(formData.get("duration_minutes"));
  const durationMinutes = Number.isInteger(rawDuration) && rawDuration > 0 && rawDuration <= 600 ? rawDuration : 60;
  if (!subjectId || !title) return;

  const { data: subject } = await supabase.from("subjects").select("id").eq("id", subjectId).maybeSingle();
  if (!subject) return;

  const { data: exam, error } = await supabase
    .from("mock_exams")
    .insert({ subject_id: subjectId, title, duration_minutes: durationMinutes, created_by: profile.id })
    .select()
    .single();

  if (error) throw new Error("Unable to create mock exam.");

  revalidatePath("/admin/mock-exams");
  if (exam) redirect(`/admin/mock-exams/${exam.id}`);
}

export async function addQuestionToExam(examId: string, questionId: string) {
  const profile = await requireAdmin();
  if (!examId || !questionId || examId.length > 100 || questionId.length > 100) return;
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_mock_exam_question_add", 300, 3600);

  const { data: exam } = await supabase.from("mock_exams").select("id, subject_id").eq("id", examId).single();
  const { data: question } = await supabase.from("questions").select("id, subject_id, review_status").eq("id", questionId).single();
  if (!exam || !question || exam.subject_id !== question.subject_id || question.review_status !== "published") return;

  const { count } = await supabase
    .from("mock_exam_questions")
    .select("*", { count: "exact", head: true })
    .eq("mock_exam_id", examId);

  const { error } = await supabase.from("mock_exam_questions").insert({
    mock_exam_id: examId,
    question_id: questionId,
    position: (count ?? 0) + 1,
  });

  if (error) throw new Error("Unable to add the question to the mock exam.");

  revalidatePath(`/admin/mock-exams/${examId}`);
}

export async function removeQuestionFromExam(examId: string, questionId: string) {
  const profile = await requireAdmin();
  if (!examId || !questionId || examId.length > 100 || questionId.length > 100) return;
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_mock_exam_question_remove", 300, 3600);

  const { error } = await supabase
    .from("mock_exam_questions")
    .delete()
    .eq("mock_exam_id", examId)
    .eq("question_id", questionId);

  if (error) throw new Error("Unable to remove the question from the mock exam.");

  revalidatePath(`/admin/mock-exams/${examId}`);
}

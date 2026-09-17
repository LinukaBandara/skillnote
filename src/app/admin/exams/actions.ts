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

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const optionalText = (formData: FormData, key: string, maxLength = 2000) => {
  const value = text(formData, key);
  return value ? value.slice(0, maxLength) : null;
};
const positiveInt = (formData: FormData, key: string, max = 100000) => {
  const value = Number(formData.get(key));
  return Number.isInteger(value) && value > 0 && value <= max ? value : null;
};

export async function createExamSeries(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_exam_series_create", 30, 3600);

  const title = text(formData, "title").slice(0, 160);
  const subjectId = text(formData, "subject_id");
  if (!title || !subjectId) return;

  const { data: series, error } = await supabase.from("exam_series").insert({
    title,
    subject_id: subjectId,
    syllabus_version_id: optionalText(formData, "syllabus_version_id", 100),
    exam_year: positiveInt(formData, "exam_year", 2100),
    series_name: optionalText(formData, "series_name", 160),
    source_type: text(formData, "source_type") || "teacher_authored",
    source_reference: optionalText(formData, "source_reference"),
    licensing_status: text(formData, "licensing_status") || "unknown",
    created_by: profile.id,
  }).select("id").single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/exams");
  if (series) redirect(`/admin/exams?series=${series.id}`);
}

export async function createPaper(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_exam_paper_create", 60, 3600);

  const examSeriesId = text(formData, "exam_series_id");
  const subjectId = text(formData, "subject_id");
  const paperNumber = positiveInt(formData, "paper_number", 100);
  if (!examSeriesId || !subjectId || !paperNumber) return;

  const { data: series } = await supabase.from("exam_series").select("subject_id, syllabus_version_id").eq("id", examSeriesId).single();
  if (!series || series.subject_id !== subjectId) throw new Error("Paper subject must match the exam series subject.");

  const { data: paper, error } = await supabase.from("papers").insert({
    exam_series_id: examSeriesId,
    subject_id: subjectId,
    syllabus_version_id: optionalText(formData, "syllabus_version_id", 100) || series.syllabus_version_id,
    paper_number: paperNumber,
    medium: text(formData, "medium") || "english",
    duration_minutes: positiveInt(formData, "duration_minutes", 1440),
    total_marks: positiveInt(formData, "total_marks", 10000),
    source: optionalText(formData, "source"),
    source_reference: optionalText(formData, "source_reference"),
    source_type: text(formData, "source_type") || "teacher_authored",
    licensing_status: text(formData, "licensing_status") || "unknown",
    created_by: profile.id,
  }).select("id").single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/exams");
  if (paper) redirect(`/admin/exams?series=${examSeriesId}&paper=${paper.id}`);
}

export async function createPaperSection(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_exam_section_create", 120, 3600);

  const paperId = text(formData, "paper_id");
  const title = text(formData, "title").slice(0, 160);
  const position = positiveInt(formData, "position", 1000);
  if (!paperId || !title || !position) return;

  const { data: paper } = await supabase.from("papers").select("id").eq("id", paperId).single();
  if (!paper) throw new Error("Paper not found.");

  const { error } = await supabase.from("paper_sections").insert({
    paper_id: paperId,
    code: optionalText(formData, "code", 50),
    title,
    instructions: optionalText(formData, "instructions"),
    position,
    marks: positiveInt(formData, "marks", 10000),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/exams");
}

export async function addQuestionToPaper(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_exam_question_add", 240, 3600);

  const sectionId = text(formData, "section_id");
  const questionId = text(formData, "question_id");
  const questionNumber = text(formData, "question_number").slice(0, 40);
  const position = positiveInt(formData, "position", 1000);
  if (!sectionId || !questionId || !questionNumber || !position) return;

  const { data: question } = await supabase.from("questions").select("id, subject_id, review_status").eq("id", questionId).single();
  const { data: section } = await supabase.from("paper_sections").select("paper_id").eq("id", sectionId).single();
  if (!question || !section) throw new Error("Question or section not found.");
  if (question.review_status !== "published") throw new Error("Only published questions can be added to an exam paper.");

  const { data: paper } = await supabase.from("papers").select("subject_id").eq("id", section.paper_id).single();
  if (!paper || paper.subject_id !== question.subject_id) throw new Error("Question subject must match the paper subject.");

  const { error } = await supabase.from("paper_questions").insert({
    section_id: sectionId,
    question_id: questionId,
    question_number: questionNumber,
    position,
    marks: positiveInt(formData, "marks", 10000),
    is_required: formData.get("is_required") === "on",
    choice_group: optionalText(formData, "choice_group", 100),
    instructions: optionalText(formData, "instructions"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/exams");
}

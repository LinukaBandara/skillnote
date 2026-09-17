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

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const optionalText = (formData: FormData, key: string) => text(formData, key) || null;
const positiveInt = (formData: FormData, key: string) => {
  const value = Number(formData.get(key));
  return Number.isInteger(value) && value > 0 ? value : null;
};

export async function createExamSeries(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const title = text(formData, "title").slice(0, 160);
  const subjectId = text(formData, "subject_id");
  if (!title || !subjectId) return;

  const { data: series, error } = await supabase.from("exam_series").insert({
    title,
    subject_id: subjectId,
    syllabus_version_id: optionalText(formData, "syllabus_version_id"),
    exam_year: positiveInt(formData, "exam_year"),
    series_name: optionalText(formData, "series_name"),
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
  const examSeriesId = text(formData, "exam_series_id");
  const subjectId = text(formData, "subject_id");
  const paperNumber = positiveInt(formData, "paper_number");
  if (!examSeriesId || !subjectId || !paperNumber) return;

  const { data: series } = await supabase.from("exam_series").select("subject_id, syllabus_version_id").eq("id", examSeriesId).single();
  if (!series || series.subject_id !== subjectId) throw new Error("Paper subject must match the exam series subject.");

  const { data: paper, error } = await supabase.from("papers").insert({
    exam_series_id: examSeriesId,
    subject_id: subjectId,
    syllabus_version_id: optionalText(formData, "syllabus_version_id") || series.syllabus_version_id,
    paper_number: paperNumber,
    medium: text(formData, "medium") || "english",
    duration_minutes: positiveInt(formData, "duration_minutes"),
    total_marks: positiveInt(formData, "total_marks"),
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
  await requireAdmin();
  const supabase = await createClient();
  const paperId = text(formData, "paper_id");
  const title = text(formData, "title").slice(0, 160);
  const position = positiveInt(formData, "position");
  if (!paperId || !title || !position) return;

  const { error } = await supabase.from("paper_sections").insert({
    paper_id: paperId,
    code: optionalText(formData, "code"),
    title,
    instructions: optionalText(formData, "instructions"),
    position,
    marks: positiveInt(formData, "marks"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/exams");
}

export async function addQuestionToPaper(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const sectionId = text(formData, "section_id");
  const questionId = text(formData, "question_id");
  const questionNumber = text(formData, "question_number");
  const position = positiveInt(formData, "position");
  if (!sectionId || !questionId || !questionNumber || !position) return;

  const { data: question } = await supabase.from("questions").select("id, subject_id, review_status").eq("id", questionId).single();
  const { data: section } = await supabase.from("paper_sections").select("paper_id").eq("id", sectionId).single();
  if (!question || !section) throw new Error("Question or section not found.");

  const { data: paper } = await supabase.from("papers").select("subject_id").eq("id", section.paper_id).single();
  if (!paper || paper.subject_id !== question.subject_id) throw new Error("Question subject must match the paper subject.");

  const { error } = await supabase.from("paper_questions").insert({
    section_id: sectionId,
    question_id: questionId,
    question_number: questionNumber,
    position,
    marks: positiveInt(formData, "marks"),
    is_required: formData.get("is_required") === "on",
    choice_group: optionalText(formData, "choice_group"),
    instructions: optionalText(formData, "instructions"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/exams");
}

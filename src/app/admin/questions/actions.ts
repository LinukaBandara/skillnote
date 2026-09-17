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

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function optionalNumber(formData: FormData, key: string) {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function positiveNumber(formData: FormData, key: string, fallback: number) {
  const value = optionalNumber(formData, key);
  return value && value > 0 ? value : fallback;
}

export async function createQuestion(formData: FormData) {
  const profile = await requireStaff();
  const supabase = await createClient();

  const subjectId = text(formData, "subject_id");
  const topicId = optionalText(formData, "topic_id");
  const syllabusVersionId = optionalText(formData, "syllabus_version_id");
  const competencyId = optionalText(formData, "competency_id");
  const competencyLevelId = optionalText(formData, "competency_level_id");
  const subtopicId = optionalText(formData, "subtopic_id");
  const learningOutcomeId = optionalText(formData, "learning_outcome_id");
  const questionText = text(formData, "question_text");
  const questionType = text(formData, "question_type") || "mcq";
  const options = [0, 1, 2, 3]
    .map((i) => text(formData, `option_${i}`))
    .filter(Boolean);
  const correctIndexRaw = optionalNumber(formData, "correct_index");
  const correctIndex = correctIndexRaw === null ? null : Math.trunc(correctIndexRaw);
  const difficulty = text(formData, "difficulty") || "medium";
  const year = optionalNumber(formData, "year");
  const marks = Math.trunc(positiveNumber(formData, "marks", 1));
  const estimatedTimeSeconds = optionalNumber(formData, "estimated_time_seconds");
  const medium = text(formData, "medium") || "english";
  const source = optionalText(formData, "source");
  const sourceType = text(formData, "source_type") || "teacher_authored";
  const sourceReference = optionalText(formData, "source_reference");
  const licensingStatus = text(formData, "licensing_status") || "unknown";
  const explanation = optionalText(formData, "explanation");
  const paperNumber = optionalNumber(formData, "paper_number");
  const section = optionalText(formData, "section");
  const tags = text(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!subjectId || !questionText) return;
  if (questionType === "mcq" && (options.length < 2 || correctIndex === null || correctIndex < 0 || correctIndex >= options.length)) return;

  const { error } = await supabase.from("questions").insert({
    subject_id: subjectId,
    topic_id: topicId,
    syllabus_version_id: syllabusVersionId,
    competency_id: competencyId,
    competency_level_id: competencyLevelId,
    subtopic_id: subtopicId,
    learning_outcome_id: learningOutcomeId,
    question_type: questionType,
    question_text: questionText,
    options: options.length ? options : null,
    correct_index: questionType === "mcq" ? correctIndex : null,
    difficulty,
    year: year === null ? null : Math.trunc(year),
    marks,
    medium,
    source,
    source_type: sourceType,
    source_reference: sourceReference,
    licensing_status: licensingStatus,
    explanation,
    estimated_time_seconds: estimatedTimeSeconds === null ? null : Math.trunc(estimatedTimeSeconds),
    paper_number: paperNumber === null ? null : Math.trunc(paperNumber),
    section,
    tags,
    review_status: "draft",
    created_by: profile.id,
  });

  if (!error) revalidatePath("/admin/questions");
}

export async function updateQuestionReviewStatus(formData: FormData) {
  const profile = await requireStaff();
  const supabase = await createClient();
  const questionId = text(formData, "question_id");
  const nextStatus = text(formData, "review_status");
  const note = optionalText(formData, "note");
  if (!questionId || !["draft", "review", "approved", "published", "archived"].includes(nextStatus)) return;

  const { data: current } = await supabase
    .from("questions")
    .select("review_status")
    .eq("id", questionId)
    .single();
  if (!current) return;

  const { error } = await supabase.from("questions").update({
    review_status: nextStatus,
    reviewed_by: nextStatus === "draft" ? null : profile.id,
    reviewed_at: nextStatus === "draft" ? null : new Date().toISOString(),
  }).eq("id", questionId);

  if (error) return;

  await supabase.from("question_review_history").insert({
    question_id: questionId,
    from_status: current.review_status,
    to_status: nextStatus,
    reviewer_id: profile.id,
    note,
  });

  revalidatePath("/admin/questions");
}

export async function deleteQuestion(questionId: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("questions").delete().eq("id", questionId);
  revalidatePath("/admin/questions");
}

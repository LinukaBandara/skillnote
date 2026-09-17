"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { enforceRateLimit } from "@/lib/security/rate-limit";
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

const QUESTION_TYPES = ["mcq", "true_false", "short_answer", "structured", "essay", "numerical", "practical"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const MEDIUMS = ["english", "sinhala", "tamil"] as const;
const SOURCE_TYPES = ["official", "licensed", "teacher_authored", "skill_note_authored", "ai_assisted"] as const;
const LICENSING_STATUSES = ["unknown", "owned", "licensed", "public_domain", "restricted", "not_for_distribution"] as const;
const REVIEW_STATUSES = ["draft", "review", "approved", "published", "archived"] as const;

async function audit(supabase: Awaited<ReturnType<typeof createClient>>, profileId: string, action: string, entityId: string, metadata: Record<string, unknown> = {}) {
  await supabase.from("audit_logs").insert({
    actor_id: profileId,
    action,
    entity_type: "question",
    entity_id: entityId,
    metadata,
  });
}

export async function createQuestion(formData: FormData) {
  const profile = await requireStaff();
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_question_create", 60, 3600);

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
    .filter(Boolean)
    .slice(0, 30);

  if (!subjectId || !questionText || questionText.length > 20000) return;
  if (!(QUESTION_TYPES as readonly string[]).includes(questionType)) return;
  if (!(DIFFICULTIES as readonly string[]).includes(difficulty)) return;
  if (!(MEDIUMS as readonly string[]).includes(medium)) return;
  if (!(SOURCE_TYPES as readonly string[]).includes(sourceType)) return;
  if (!(LICENSING_STATUSES as readonly string[]).includes(licensingStatus)) return;
  if (questionType === "mcq" && (options.length < 2 || correctIndex === null || correctIndex < 0 || correctIndex >= options.length)) return;
  if (options.some((option) => option.length > 5000)) return;

  const { data: created, error } = await supabase.from("questions").insert({
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
  }).select("id").single();

  if (!error && created) {
    await audit(supabase, profile.id, "question.created", created.id, { subject_id: subjectId, question_type: questionType });
    revalidatePath("/admin/questions");
  }
}

export async function updateQuestionReviewStatus(formData: FormData) {
  const profile = await requireStaff();
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_question_review", 120, 3600);

  const questionId = text(formData, "question_id");
  const nextStatus = text(formData, "review_status");
  const note = optionalText(formData, "note");
  if (!questionId || !(REVIEW_STATUSES as readonly string[]).includes(nextStatus)) return;
  if (note && note.length > 5000) return;

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
  await audit(supabase, profile.id, "question.review_status_changed", questionId, {
    from_status: current.review_status,
    to_status: nextStatus,
  });

  revalidatePath("/admin/questions");
}

export async function deleteQuestion(questionId: string) {
  const profile = await requireStaff();
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_question_delete", 30, 3600);
  if (!questionId || questionId.length > 100) return;

  const { data: current } = await supabase
    .from("questions")
    .select("id, subject_id, review_status")
    .eq("id", questionId)
    .single();
  if (!current) return;

  const { error } = await supabase.from("questions").delete().eq("id", questionId);
  if (error) return;

  await audit(supabase, profile.id, "question.deleted", questionId, {
    subject_id: current.subject_id,
    review_status: current.review_status,
  });
  revalidatePath("/admin/questions");
}

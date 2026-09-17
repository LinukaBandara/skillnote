"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import type { PreferredLanguage } from "@/types/db";

const LANGUAGES = new Set<PreferredLanguage>(["si", "ta"]);
const TABLES = new Set([
  "syllabus_unit_translations",
  "syllabus_topic_translations",
  "syllabus_subtopic_translations",
  "syllabus_learning_outcome_translations",
  "question_translations",
  "course_translations",
  "module_translations",
  "lesson_translations",
]);

export async function saveTranslation(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "student") redirect("/dashboard");

  const table = formData.get("table");
  const idColumn = formData.get("idColumn");
  const id = formData.get("id");
  const language = formData.get("language");

  if (
    typeof table !== "string" ||
    !TABLES.has(table) ||
    typeof idColumn !== "string" ||
    typeof id !== "string" ||
    typeof language !== "string" ||
    !LANGUAGES.has(language as PreferredLanguage)
  ) return;

  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    [idColumn]: id,
    language_code: language,
  };

  if (table === "syllabus_unit_translations" || table === "syllabus_topic_translations" || table === "course_translations" || table === "module_translations") {
    payload.title = String(formData.get("title") ?? "").trim();
  } else if (table === "syllabus_subtopic_translations") {
    payload.title = String(formData.get("title") ?? "").trim();
    payload.description = String(formData.get("description") ?? "").trim() || null;
  } else if (table === "syllabus_learning_outcome_translations") {
    payload.statement = String(formData.get("statement") ?? "").trim();
  } else if (table === "lesson_translations") {
    payload.title = String(formData.get("title") ?? "").trim();
    payload.content = String(formData.get("content") ?? "").trim() || null;
  } else if (table === "question_translations") {
    payload.question_text = String(formData.get("question_text") ?? "").trim();
    payload.model_answer = String(formData.get("model_answer") ?? "").trim() || null;
    payload.explanation = String(formData.get("explanation") ?? "").trim() || null;
  }

  const textField = ["title", "statement", "question_text"].find((key) => key in payload);
  if (textField && !String(payload[textField] ?? "").trim()) return;

  await supabase.from(table).upsert(payload, { onConflict: `${idColumn},language_code` });
  revalidatePath("/admin/translations");
}

export async function deleteTranslation(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "student") redirect("/dashboard");

  const table = formData.get("table");
  const idColumn = formData.get("idColumn");
  const id = formData.get("id");
  const language = formData.get("language");

  if (typeof table !== "string" || !TABLES.has(table) || typeof idColumn !== "string" || typeof id !== "string" || typeof language !== "string" || !LANGUAGES.has(language as PreferredLanguage)) return;

  const supabase = await createClient();
  await supabase.from(table).delete().eq(idColumn, id).eq("language_code", language);
  revalidatePath("/admin/translations");
}

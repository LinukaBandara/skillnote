"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import type { PreferredLanguage } from "@/types/db";

const LANGUAGES = new Set<PreferredLanguage>(["si", "ta"]);

const TABLE_CONFIG = {
  syllabus_unit_translations: { idColumn: "unit_id", required: "title", fields: ["title"] },
  syllabus_topic_translations: { idColumn: "topic_id", required: "title", fields: ["title"] },
  syllabus_subtopic_translations: { idColumn: "subtopic_id", required: "title", fields: ["title", "description"] },
  syllabus_learning_outcome_translations: { idColumn: "learning_outcome_id", required: "statement", fields: ["statement"] },
  question_translations: { idColumn: "question_id", required: "question_text", fields: ["question_text", "model_answer", "explanation"] },
  course_translations: { idColumn: "course_id", required: "title", fields: ["title", "description"] },
  module_translations: { idColumn: "module_id", required: "title", fields: ["title"] },
  lesson_translations: { idColumn: "lesson_id", required: "title", fields: ["title", "content"] },
} as const;

type TranslationTable = keyof typeof TABLE_CONFIG;

function parseRequest(formData: FormData) {
  const table = formData.get("table");
  const id = formData.get("id");
  const language = formData.get("language");
  if (
    typeof table !== "string" || !(table in TABLE_CONFIG) ||
    typeof id !== "string" || !id ||
    typeof language !== "string" || !LANGUAGES.has(language as PreferredLanguage)
  ) return null;

  const config = TABLE_CONFIG[table as TranslationTable];
  return { table: table as TranslationTable, id, language: language as PreferredLanguage, config };
}

export async function saveTranslation(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const request = parseRequest(formData);
  if (!request) return;

  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    [request.config.idColumn]: request.id,
    language_code: request.language,
  };

  for (const field of request.config.fields) {
    const value = String(formData.get(field) ?? "").trim();
    payload[field] = value || null;
  }

  const requiredValue = String(payload[request.config.required] ?? "").trim();
  if (!requiredValue) return;

  await supabase
    .from(request.table)
    .upsert(payload, { onConflict: `${request.config.idColumn},language_code` });

  revalidatePath("/admin/translations");
}

export async function deleteTranslation(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const request = parseRequest(formData);
  if (!request) return;

  const supabase = await createClient();
  await supabase
    .from(request.table)
    .delete()
    .eq(request.config.idColumn, request.id)
    .eq("language_code", request.language);

  revalidatePath("/admin/translations");
}

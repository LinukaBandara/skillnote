"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import type { PreferredLanguage } from "@/types/db";

const LANGUAGES = new Set<PreferredLanguage>(["si", "ta"]);
const STATUSES = new Set(["draft", "review", "published", "archived"]);
const MAX_ID_LENGTH = 100;
const MAX_TITLE_LENGTH = 240;
const MAX_TEXT_LENGTH = 20000;

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

type StaffProfile = NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>;

async function requireTranslationManager() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "platform_admin" && profile.role !== "institute_admin") {
    redirect("/dashboard");
  }
  return profile as StaffProfile;
}

function parseRequest(formData: FormData) {
  const table = formData.get("table");
  const id = formData.get("id");
  const language = formData.get("language");
  if (
    typeof table !== "string" || !(table in TABLE_CONFIG) ||
    typeof id !== "string" || !id || id.length > MAX_ID_LENGTH ||
    typeof language !== "string" || !LANGUAGES.has(language as PreferredLanguage)
  ) return null;

  const config = TABLE_CONFIG[table as TranslationTable];
  return { table: table as TranslationTable, id, language: language as PreferredLanguage, config };
}

function readText(formData: FormData, field: string, maxLength: number) {
  const value = String(formData.get(field) ?? "").trim();
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export async function saveTranslation(formData: FormData) {
  const profile = await requireTranslationManager();
  const request = parseRequest(formData);
  if (!request) return;

  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_translation_save", 120, 3600);

  const payload: Record<string, unknown> = {
    [request.config.idColumn]: request.id,
    language_code: request.language,
    translated_by: profile.id,
    status: "draft",
  };

  for (const field of request.config.fields) {
    const value = readText(formData, field, field === "title" ? MAX_TITLE_LENGTH : MAX_TEXT_LENGTH);
    payload[field] = value || null;
  }

  const requiredValue = String(payload[request.config.required] ?? "").trim();
  if (!requiredValue) return;

  const { error } = await supabase
    .from(request.table)
    .upsert(payload, { onConflict: `${request.config.idColumn},language_code` });
  if (error) return;

  revalidatePath("/admin/translations");
}

export async function updateTranslationStatus(formData: FormData) {
  const profile = await requireTranslationManager();
  const request = parseRequest(formData);
  const status = formData.get("status");
  if (!request || typeof status !== "string" || !STATUSES.has(status)) return;

  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_translation_status", 240, 3600);

  const patch: Record<string, unknown> = { status };
  if (status === "published" || status === "archived") {
    patch.reviewed_by = profile.id;
    patch.reviewed_at = new Date().toISOString();
  } else if (status === "draft") {
    patch.reviewed_by = null;
    patch.reviewed_at = null;
  }

  const { error } = await supabase
    .from(request.table)
    .update(patch)
    .eq(request.config.idColumn, request.id)
    .eq("language_code", request.language);
  if (error) return;

  revalidatePath("/admin/translations");
}

export async function deleteTranslation(formData: FormData) {
  const profile = await requireTranslationManager();
  const request = parseRequest(formData);
  if (!request) return;

  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_translation_delete", 60, 3600);

  const { error } = await supabase
    .from(request.table)
    .delete()
    .eq(request.config.idColumn, request.id)
    .eq("language_code", request.language);
  if (error) return;

  revalidatePath("/admin/translations");
}

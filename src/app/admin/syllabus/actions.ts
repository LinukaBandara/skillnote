"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requirePlatformAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "platform_admin") redirect("/admin");
  return profile;
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function position(formData: FormData) {
  const value = Number(formData.get("position"));
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export async function createSyllabusVersion(formData: FormData) {
  const profile = await requirePlatformAdmin();
  const supabase = await createClient();

  const code = text(formData, "code");
  const name = text(formData, "name");
  if (!code || !name) return;

  await supabase.from("syllabus_versions").insert({
    code,
    name,
    academic_year_from: Number(formData.get("academic_year_from")) || null,
    academic_year_to: Number(formData.get("academic_year_to")) || null,
    notes: optionalText(formData, "notes"),
    created_by: profile.id,
  });

  revalidatePath("/admin/syllabus");
}

export async function createSubtopic(formData: FormData) {
  await requirePlatformAdmin();
  const supabase = await createClient();
  const topicId = text(formData, "topic_id");
  const title = text(formData, "title");
  if (!topicId || !title) return;

  await supabase.from("syllabus_subtopics").insert({
    topic_id: topicId,
    title,
    description: optionalText(formData, "description"),
    position: position(formData),
  });

  revalidatePath("/admin/syllabus");
}

export async function createLearningOutcome(formData: FormData) {
  await requirePlatformAdmin();
  const supabase = await createClient();
  const subtopicId = text(formData, "subtopic_id");
  const statement = text(formData, "statement");
  if (!subtopicId || !statement) return;

  await supabase.from("syllabus_learning_outcomes").insert({
    subtopic_id: subtopicId,
    code: optionalText(formData, "code"),
    statement,
    position: position(formData),
  });

  revalidatePath("/admin/syllabus");
}

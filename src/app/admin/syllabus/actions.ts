"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requirePlatformAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "platform_admin") redirect("/admin");
  return profile;
}

function text(formData: FormData, key: string, maxLength = 10000) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

function optionalText(formData: FormData, key: string, maxLength = 10000) {
  const value = text(formData, key, maxLength);
  return value || null;
}

function position(formData: FormData) {
  const value = Number(formData.get("position"));
  return Number.isInteger(value) && value > 0 && value <= 10000 ? value : 1;
}

function year(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isInteger(value) && value >= 1900 && value <= 2100 ? value : null;
}

export async function createSyllabusVersion(formData: FormData) {
  const profile = await requirePlatformAdmin();
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_syllabus_version_create", 30, 3600);
  const code = text(formData, "code", 100);
  const name = text(formData, "name", 200);
  const academicYearFrom = year(formData, "academic_year_from");
  const academicYearTo = year(formData, "academic_year_to");

  if (!code || !name) return;
  if (academicYearFrom && academicYearTo && academicYearTo < academicYearFrom) return;

  const { error } = await supabase.from("syllabus_versions").insert({
    code,
    name,
    academic_year_from: academicYearFrom,
    academic_year_to: academicYearTo,
    notes: optionalText(formData, "notes", 10000),
    created_by: profile.id,
  });

  if (error) throw new Error("Unable to create syllabus version.");
  revalidatePath("/admin/syllabus");
}

export async function createCompetency(formData: FormData) {
  const profile = await requirePlatformAdmin();
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_competency_create", 120, 3600);
  const syllabusVersionId = text(formData, "syllabus_version_id", 100);
  const subjectId = text(formData, "subject_id", 100);
  const code = text(formData, "code", 100);
  const title = text(formData, "title", 300);

  if (!syllabusVersionId || !subjectId || !code || !title) return;

  const { error: competencyError } = await supabase.from("syllabus_competencies").insert({
    syllabus_version_id: syllabusVersionId,
    subject_id: subjectId,
    code,
    title,
    description: optionalText(formData, "description"),
    position: position(formData),
  });

  if (competencyError) throw new Error("Unable to create competency.");

  const { error: linkError } = await supabase.from("syllabus_version_subjects").upsert(
    { syllabus_version_id: syllabusVersionId, subject_id: subjectId },
    { onConflict: "syllabus_version_id,subject_id", ignoreDuplicates: true },
  );

  if (linkError) throw new Error("Competency created, but subject-version link failed.");
  revalidatePath("/admin/syllabus");
}

export async function createCompetencyLevel(formData: FormData) {
  const profile = await requirePlatformAdmin();
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_competency_level_create", 120, 3600);
  const competencyId = text(formData, "competency_id", 100);
  const code = text(formData, "code", 100);
  const title = text(formData, "title", 300);
  if (!competencyId || !code || !title) return;

  const { data: competency, error: competencyError } = await supabase
    .from("syllabus_competencies")
    .select("syllabus_version_id, subject_id")
    .eq("id", competencyId)
    .single();

  if (competencyError || !competency) throw new Error("The selected competency could not be found.");

  const { error } = await supabase.from("syllabus_competency_levels").insert({
    competency_id: competencyId,
    syllabus_version_id: competency.syllabus_version_id,
    subject_id: competency.subject_id,
    code,
    title,
    description: optionalText(formData, "description"),
    position: position(formData),
  });

  if (error) throw new Error("Unable to create competency level.");
  revalidatePath("/admin/syllabus");
}

export async function createSubtopic(formData: FormData) {
  const profile = await requirePlatformAdmin();
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_subtopic_create", 120, 3600);
  const topicId = text(formData, "topic_id", 100);
  const title = text(formData, "title", 300);
  if (!topicId || !title) return;

  const { error } = await supabase.from("syllabus_subtopics").insert({
    topic_id: topicId,
    title,
    description: optionalText(formData, "description"),
    position: position(formData),
  });

  if (error) throw new Error("Unable to create subtopic.");
  revalidatePath("/admin/syllabus");
}

export async function createLearningOutcome(formData: FormData) {
  const profile = await requirePlatformAdmin();
  const supabase = await createClient();
  await enforceRateLimit(supabase, profile.id, "admin_learning_outcome_create", 120, 3600);
  const subtopicId = text(formData, "subtopic_id", 100);
  const statement = text(formData, "statement", 5000);
  if (!subtopicId || !statement) return;

  const { error } = await supabase.from("syllabus_learning_outcomes").insert({
    subtopic_id: subtopicId,
    code: optionalText(formData, "code", 100),
    statement,
    position: position(formData),
  });

  if (error) throw new Error("Unable to create learning outcome.");
  revalidatePath("/admin/syllabus");
}

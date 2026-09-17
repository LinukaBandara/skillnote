"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function addStudyItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = formData.get("title") as string;
  const subjectId = (formData.get("subject_id") as string) || null;
  const scheduledDate = formData.get("scheduled_date") as string;
  const scheduledTime = (formData.get("scheduled_time") as string) || null;
  const durationMinutes = Number(formData.get("duration_minutes")) || 30;

  await supabase.from("study_plan_items").insert({
    student_id: user.id,
    subject_id: subjectId,
    title,
    scheduled_date: scheduledDate,
    scheduled_time: scheduledTime,
    duration_minutes: durationMinutes,
  });

  revalidatePath("/study-plan");
}

export async function toggleStudyItem(itemId: string, completed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("study_plan_items")
    .update({ completed })
    .eq("id", itemId)
    .eq("student_id", user.id);

  revalidatePath("/study-plan");
}

export async function deleteStudyItem(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("study_plan_items").delete().eq("id", itemId).eq("student_id", user.id);

  revalidatePath("/study-plan");
}

// Suggests today's plan items from topics the student has marked weak or needs_revision,
// that aren't already scheduled for today. Real data only — nothing fabricated.
export async function suggestFromWeakTopics() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);

  const { data: weakTopics } = await supabase
    .from("topic_progress")
    .select("topic_id, status, syllabus_topics(title, syllabus_units(subject_id))")
    .eq("student_id", user.id)
    .in("status", ["weak", "needs_revision"]);

  const { data: existingToday } = await supabase
    .from("study_plan_items")
    .select("topic_id")
    .eq("student_id", user.id)
    .eq("scheduled_date", today);

  const existingTopicIds = new Set((existingToday ?? []).map((e) => e.topic_id));

  const toInsert = (weakTopics ?? [])
    .filter((t) => !existingTopicIds.has(t.topic_id))
    .slice(0, 3)
    .map((t) => {
      const topic = t.syllabus_topics as unknown as { title: string; syllabus_units: { subject_id: string }[] | { subject_id: string } } | null;
      const unit = Array.isArray(topic?.syllabus_units) ? topic?.syllabus_units[0] : topic?.syllabus_units;
      return {
        student_id: user.id,
        subject_id: unit?.subject_id ?? null,
        topic_id: t.topic_id,
        title: `Revise: ${topic?.title ?? "Topic"}`,
        scheduled_date: today,
        duration_minutes: 30,
      };
    });

  if (toInsert.length > 0) {
    await supabase.from("study_plan_items").insert(toInsert);
  }

  revalidatePath("/study-plan");
}

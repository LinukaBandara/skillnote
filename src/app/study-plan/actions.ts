"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function addStudyItem(formData: FormData) {
  const { supabase, user } = await getUser();

  const title = String(formData.get("title") ?? "").trim();
  const subjectId = String(formData.get("subject_id") ?? "") || null;
  const scheduledDate = String(formData.get("scheduled_date") ?? "");
  const scheduledTime = String(formData.get("scheduled_time") ?? "") || null;
  const durationMinutes = Number(formData.get("duration_minutes")) || 30;

  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) return;
  if (![15, 30, 45, 60].includes(durationMinutes)) return;

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
  const { supabase, user } = await getUser();
  await supabase.from("study_plan_items").update({ completed }).eq("id", itemId).eq("student_id", user.id);
  revalidatePath("/study-plan");
}

export async function deleteStudyItem(itemId: string) {
  const { supabase, user } = await getUser();
  await supabase.from("study_plan_items").delete().eq("id", itemId).eq("student_id", user.id);
  revalidatePath("/study-plan");
}

/**
 * Converts the intelligence layer's live recommendations into concrete study sessions.
 * Falls back to manually marked weak/revision topics when recommendations are unavailable.
 */
export async function suggestFromWeakTopics() {
  const { supabase, user } = await getUser();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existingToday } = await supabase
    .from("study_plan_items")
    .select("topic_id")
    .eq("student_id", user.id)
    .eq("scheduled_date", today);
  const existingTopicIds = new Set((existingToday ?? []).map((item) => item.topic_id).filter(Boolean));

  const { data: recommendations } = await supabase
    .from("practice_recommendations")
    .select("topic_id, recommendation_type, priority, reason")
    .eq("student_id", user.id)
    .is("completed_at", null)
    .order("priority", { ascending: false })
    .limit(8);

  const recommendationTopics = (recommendations ?? []).filter(
    (item) => item.topic_id && !existingTopicIds.has(item.topic_id)
  );

  const topicIds = recommendationTopics.map((item) => item.topic_id as string);
  const { data: topicRows } = topicIds.length
    ? await supabase.from("syllabus_topics").select("id,title,unit_id").in("id", topicIds)
    : { data: [] };

  const unitIds = (topicRows ?? []).map((topic) => topic.unit_id);
  const { data: unitRows } = unitIds.length
    ? await supabase.from("syllabus_units").select("id,subject_id").in("id", unitIds)
    : { data: [] };
  const subjectByUnit = new Map((unitRows ?? []).map((unit) => [unit.id, unit.subject_id]));
  const topicById = new Map((topicRows ?? []).map((topic) => [topic.id, topic]));

  let toInsert = recommendationTopics.slice(0, 3).map((recommendation) => {
    const topic = topicById.get(recommendation.topic_id as string);
    const type = recommendation.recommendation_type === "review" ? "Review" : "Practice";
    return {
      student_id: user.id,
      subject_id: topic ? subjectByUnit.get(topic.unit_id) ?? null : null,
      topic_id: recommendation.topic_id,
      title: `${type}: ${topic?.title ?? "Recommended topic"}`,
      scheduled_date: today,
      duration_minutes: recommendation.recommendation_type === "mock" ? 60 : 30,
    };
  });

  if (toInsert.length === 0) {
    const { data: weakTopics } = await supabase
      .from("topic_progress")
      .select("topic_id, syllabus_topics(title, unit_id)")
      .eq("student_id", user.id)
      .in("status", ["weak", "needs_revision"])
      .limit(3);

    const fallbackTopicIds = (weakTopics ?? []).map((item) => item.topic_id).filter((id) => !existingTopicIds.has(id));
    const fallbackUnitIds = (weakTopics ?? [])
      .map((item) => {
        const topic = item.syllabus_topics as unknown as { unit_id: string } | null;
        return topic?.unit_id;
      })
      .filter(Boolean) as string[];
    const { data: fallbackUnits } = fallbackUnitIds.length
      ? await supabase.from("syllabus_units").select("id,subject_id").in("id", fallbackUnitIds)
      : { data: [] };
    const fallbackSubjects = new Map((fallbackUnits ?? []).map((unit) => [unit.id, unit.subject_id]));

    toInsert = (weakTopics ?? [])
      .filter((item) => fallbackTopicIds.includes(item.topic_id))
      .slice(0, 3)
      .map((item) => {
        const topic = item.syllabus_topics as unknown as { title: string; unit_id: string } | null;
        return {
          student_id: user.id,
          subject_id: topic ? fallbackSubjects.get(topic.unit_id) ?? null : null,
          topic_id: item.topic_id,
          title: `Revise: ${topic?.title ?? "Topic"}`,
          scheduled_date: today,
          duration_minutes: 30,
        };
      });
  }

  if (toInsert.length > 0) await supabase.from("study_plan_items").insert(toInsert);

  revalidatePath("/study-plan");
  revalidatePath("/skill-insights");
}

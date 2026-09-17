"use server";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { TopicStatus } from "@/types/db";

const STATUS_PERCENT: Record<TopicStatus, number> = {
  not_started: 0,
  in_progress: 50,
  weak: 40,
  needs_revision: 60,
  completed: 100,
};

export async function updateTopicStatus(
  topicId: string,
  subjectId: string,
  status: TopicStatus
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await enforceRateLimit(supabase, user.id, "topic_status_update", 120, 3600);

  if (!topicId || topicId.length > 100 || !subjectId || subjectId.length > 100) return;
  if (!Object.prototype.hasOwnProperty.call(STATUS_PERCENT, status)) return;

  const { data: topic } = await supabase
    .from("syllabus_topics")
    .select("id, unit_id")
    .eq("id", topicId)
    .maybeSingle();
  if (!topic) return;

  const { data: unit } = await supabase
    .from("syllabus_units")
    .select("id, subject_id")
    .eq("id", topic.unit_id)
    .eq("subject_id", subjectId)
    .maybeSingle();
  if (!unit) return;

  await supabase.from("topic_progress").upsert(
    {
      student_id: user.id,
      topic_id: topicId,
      status,
      percent: STATUS_PERCENT[status],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,topic_id" }
  );

  revalidatePath(`/subjects/${subjectId}`);
  revalidatePath("/dashboard");
}

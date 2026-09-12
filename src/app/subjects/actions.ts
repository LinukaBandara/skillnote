"use server";

import { createClient } from "@/lib/supabase/server";
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

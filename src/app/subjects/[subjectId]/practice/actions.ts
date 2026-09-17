"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function submitQuestionAttempt(
  questionId: string,
  subjectId: string,
  selectedIndex: number,
  correctIndex: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isCorrect = selectedIndex === correctIndex;

  await supabase.from("question_attempts").insert({
    student_id: user.id,
    question_id: questionId,
    selected_index: selectedIndex,
    is_correct: isCorrect,
  });

  // Recalculate mastery + next review date for this question's topic.
  const { data: question } = await supabase
    .from("questions")
    .select("topic_id")
    .eq("id", questionId)
    .single();

  if (question?.topic_id) {
    await supabase.rpc("update_topic_mastery", { p_topic_id: question.topic_id });
  }

  revalidatePath(`/subjects/${subjectId}/practice`);
  return { isCorrect };
}

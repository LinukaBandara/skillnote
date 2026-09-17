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

  const { error: attemptError } = await supabase.from("question_attempts").insert({
    student_id: user.id,
    question_id: questionId,
    selected_index: selectedIndex,
    is_correct: isCorrect,
  });

  if (attemptError) throw new Error("Unable to save question attempt.");

  const { data: question } = await supabase
    .from("questions")
    .select("topic_id, learning_outcome_id")
    .eq("id", questionId)
    .single();

  if (question?.topic_id) {
    await supabase.rpc("update_topic_mastery", { p_topic_id: question.topic_id });
  }

  if (question?.learning_outcome_id) {
    await supabase.rpc("refresh_learning_outcome_mastery", {
      p_student_id: user.id,
      p_learning_outcome_id: question.learning_outcome_id,
    });
    await supabase.rpc("refresh_practice_recommendations", { p_student_id: user.id });
  }

  revalidatePath(`/subjects/${subjectId}/practice`);
  revalidatePath("/dashboard");
  revalidatePath("/study-plan");
  return { isCorrect };
}

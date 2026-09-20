"use server";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function submitQuestionAttempt(
  questionId: string,
  subjectId: string,
  selectedIndex: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await enforceRateLimit(supabase, user.id, "question_attempt", 120, 3600);

  if (!Number.isInteger(selectedIndex) || selectedIndex < 0) {
    throw new Error("Invalid answer selection.");
  }

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("subject_id, topic_id, learning_outcome_id, correct_index, options, question_type")
    .eq("id", questionId)
    .maybeSingle();

  if (questionError || !question) throw new Error("Question not found.");
  if (question.subject_id !== subjectId) throw new Error("Question does not belong to this subject.");
  if (question.question_type !== "mcq" && question.question_type !== "true_false") {
    throw new Error("This question type does not support answer submission here.");
  }

  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length > 0 && selectedIndex >= options.length) {
    throw new Error("Invalid answer selection.");
  }

  const correctIndex = Number(question.correct_index);
  if (!Number.isInteger(correctIndex) || correctIndex < 0) {
    throw new Error("This question is not configured for practice yet.");
  }

  const isCorrect = selectedIndex === correctIndex;

  const { error: attemptError } = await supabase.from("question_attempts").insert({
    student_id: user.id,
    question_id: questionId,
    selected_index: selectedIndex,
    is_correct: isCorrect,
  });

  if (attemptError) throw new Error("Unable to save question attempt.");

  if (question.topic_id) {
    const { error } = await supabase.rpc("update_topic_mastery", { p_topic_id: question.topic_id });
    if (error) console.error("Topic mastery refresh failed", error);
  }

  if (question.learning_outcome_id) {
    const { error: masteryError } = await supabase.rpc("refresh_learning_outcome_mastery", {
      p_student_id: user.id,
      p_learning_outcome_id: question.learning_outcome_id,
    });
    if (masteryError) console.error("Learning outcome mastery refresh failed", masteryError);

    const { error: recommendationError } = await supabase.rpc("refresh_practice_recommendations", {
      p_student_id: user.id,
    });
    if (recommendationError) console.error("Practice recommendation refresh failed", recommendationError);
  }

  revalidatePath(`/subjects/${subjectId}/practice`);
  revalidatePath("/dashboard");
  revalidatePath("/study-plan");
  revalidatePath("/skill-insights");
  return { isCorrect };
}

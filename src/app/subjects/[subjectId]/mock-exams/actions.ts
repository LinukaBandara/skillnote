"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function startMockExam(examId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Reuse an existing in-progress attempt if one exists, so a page refresh
  // doesn't silently create duplicate attempts.
  const { data: existing } = await supabase
    .from("mock_exam_attempts")
    .select("id")
    .eq("mock_exam_id", examId)
    .eq("student_id", user.id)
    .is("submitted_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { count } = await supabase
    .from("mock_exam_questions")
    .select("*", { count: "exact", head: true })
    .eq("mock_exam_id", examId);

  const { data: attempt } = await supabase
    .from("mock_exam_attempts")
    .insert({
      mock_exam_id: examId,
      student_id: user.id,
      total_questions: count ?? 0,
    })
    .select()
    .single();

  return attempt?.id as string | undefined;
}

export async function submitMockExam(
  attemptId: string,
  answers: { questionId: string; selectedIndex: number | undefined; correctIndex: number }[],
  timeTakenSeconds: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const answerRows = answers.map((a) => ({
    attempt_id: attemptId,
    question_id: a.questionId,
    selected_index: a.selectedIndex ?? null,
    is_correct: a.selectedIndex !== undefined && a.selectedIndex === a.correctIndex,
  }));

  if (answerRows.length > 0) {
    await supabase.from("mock_exam_answers").insert(answerRows);
  }

  const correctCount = answerRows.filter((a) => a.is_correct).length;
  const score = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  await supabase
    .from("mock_exam_attempts")
    .update({
      submitted_at: new Date().toISOString(),
      score,
      correct_count: correctCount,
      time_taken_seconds: timeTakenSeconds,
    })
    .eq("id", attemptId);

  return { score, correctCount };
}

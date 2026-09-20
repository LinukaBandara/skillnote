"use server";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { redirect } from "next/navigation";

export async function startMockExam(examId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await enforceRateLimit(supabase, user.id, "mock_exam_start", 20, 3600);

  const { data: exam, error: examError } = await supabase
    .from("mock_exams")
    .select("id, subject_id, duration_minutes")
    .eq("id", examId)
    .maybeSingle();

  if (examError || !exam) throw new Error("Mock exam not found.");

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

  const { count, error: questionCountError } = await supabase
    .from("mock_exam_questions")
    .select("question_id", { count: "exact", head: true })
    .eq("mock_exam_id", examId);

  if (questionCountError || !count) throw new Error("This mock exam has no questions yet.");

  const { data: attempt, error: attemptError } = await supabase
    .from("mock_exam_attempts")
    .insert({
      mock_exam_id: examId,
      student_id: user.id,
      total_questions: count,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) throw new Error("Unable to start the mock exam.");
  return attempt.id as string;
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

  await enforceRateLimit(supabase, user.id, "mock_exam_submit", 10, 3600);

  if (!attemptId || attemptId.length > 100) {
    throw new Error("Invalid exam attempt.");
  }
  if (!Array.isArray(answers) || answers.length > 500) {
    throw new Error("Invalid answer payload.");
  }
  if (!Number.isInteger(timeTakenSeconds) || timeTakenSeconds < 0 || timeTakenSeconds > 86400) {
    throw new Error("Invalid exam duration.");
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("mock_exam_attempts")
    .select("id, mock_exam_id, student_id, submitted_at, started_at, total_questions, mock_exams(duration_minutes)")
    .eq("id", attemptId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (attemptError || !attempt) throw new Error("Mock exam attempt not found.");
  if (attempt.submitted_at) throw new Error("This mock exam has already been submitted.");

  const durationMinutes = Number(attempt.mock_exams?.[0]?.duration_minutes ?? 0);
  if (durationMinutes > 0 && timeTakenSeconds > durationMinutes * 60 + 30) {
    throw new Error("The mock exam time limit has been exceeded.");
  }

  const { data: examQuestions, error: questionError } = await supabase
    .from("mock_exam_questions")
    .select("question_id, questions(correct_index, options, question_type)")
    .eq("mock_exam_id", attempt.mock_exam_id)
    .order("position");

  if (questionError || !examQuestions) throw new Error("Unable to validate mock exam questions.");

  const allowedQuestions = new Map(
    examQuestions.map((row) => [
      row.question_id,
      row.questions,
    ])
  );

  const seen = new Set<string>();
  const validatedAnswers: { questionId: string; selectedIndex: number | null }[] = [];

  for (const answer of answers) {
    if (!answer || typeof answer.questionId !== "string" || seen.has(answer.questionId)) continue;
    const question = allowedQuestions.get(answer.questionId);
    if (!question) continue;

    seen.add(answer.questionId);
    const selectedIndex = answer.selectedIndex === undefined ? null : answer.selectedIndex;
    if (selectedIndex !== null && (!Number.isInteger(selectedIndex) || selectedIndex < 0)) {
      throw new Error("Invalid answer selection.");
    }

    const options = Array.isArray(question?.[0]?.options) ? question[0].options : [];
    if (selectedIndex !== null && options.length > 0 && selectedIndex >= options.length) {
      throw new Error("Invalid answer selection.");
    }

    validatedAnswers.push({ questionId: answer.questionId, selectedIndex });
  }

  if (validatedAnswers.length !== examQuestions.length) {
    for (const row of examQuestions) {
      if (!seen.has(row.question_id)) {
        validatedAnswers.push({ questionId: row.question_id, selectedIndex: null });
      }
    }
  }

  const answerRows = validatedAnswers.map((answer) => ({
    attempt_id: attemptId,
    question_id: answer.questionId,
    selected_index: answer.selectedIndex,
    is_correct: false,
  }));

  const { error: answersError } = await supabase.from("mock_exam_answers").insert(answerRows);
  if (answersError) throw new Error("Unable to save mock exam answers.");

  const { data: finalized, error: finalizeError } = await supabase.rpc("finalize_mock_exam_attempt", {
    p_attempt_id: attemptId,
  });

  if (finalizeError || !finalized?.[0]) {
    throw new Error(finalizeError?.message === "The mock exam time limit has been exceeded"
      ? finalizeError.message
      : "Unable to finalize the mock exam.");
  }

  return {
    score: Number(finalized[0].score),
    correctCount: Number(finalized[0].correct_count),
  };
}

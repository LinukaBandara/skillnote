import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { notFound, redirect } from "next/navigation";
import { startMockExam } from "../actions";
import { MockExamRunner } from "./MockExamRunner";

export default async function MockExamPage({
  params,
}: {
  params: Promise<{ subjectId: string; examId: string }>;
}) {
  const { subjectId, examId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: exam } = await supabase.from("mock_exams").select("*").eq("id", examId).single();
  if (!exam) notFound();

  const { data: examQuestions } = await supabase
    .from("mock_exam_questions")
    .select("position, questions(*)")
    .eq("mock_exam_id", examId)
    .order("position");

  const questions = (examQuestions ?? [])
    .map((eq) => eq.questions)
    .filter(Boolean) as unknown as { id: string; question_text: string; options: string[]; correct_index: number }[];

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-ink-soft text-sm">This mock exam has no questions yet.</p>
      </div>
    );
  }

  const attemptId = await startMockExam(examId);
  if (!attemptId) redirect(`/subjects/${subjectId}/mock-exams`);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-xl font-semibold mb-1">{exam.title}</h1>
      <p className="text-ink-faint text-xs mb-8">
        {questions.length} questions · {exam.duration_minutes} minutes · the timer starts now
      </p>
      <MockExamRunner
        questions={questions}
        attemptId={attemptId}
        subjectId={subjectId}
        examId={examId}
        durationMinutes={exam.duration_minutes}
      />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function MockExamResultsPage({
  params,
}: {
  params: Promise<{ subjectId: string; examId: string; attemptId: string }>;
}) {
  const { subjectId, attemptId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("mock_exam_attempts")
    .select("*, mock_exams(title)")
    .eq("id", attemptId)
    .single();

  if (!attempt || attempt.student_id !== profile.id) notFound();

  const { data: answers } = await supabase
    .from("mock_exam_answers")
    .select("*, questions(question_text, options, correct_index, topic_id, syllabus_topics(title))")
    .eq("attempt_id", attemptId);

  const timeTaken = attempt.time_taken_seconds ?? 0;
  const mins = Math.floor(timeTaken / 60);
  const secs = timeTaken % 60;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href={`/subjects/${subjectId}/mock-exams`} className="text-sm text-ink-soft hover:text-ink">
        ← Mock exams
      </Link>

      <div className="clay p-8 text-center mt-6 mb-10">
        <p className="text-xs text-ink-faint mb-2">{attempt.mock_exams?.title}</p>
        <p className="text-[44px] font-bold tracking-[-0.035em] mb-2">{attempt.score}%</p>
        <p className="text-ink-soft text-sm">
          {attempt.correct_count} of {attempt.total_questions} correct · {mins}m {secs}s
        </p>
      </div>

      <h2 className="section-label mb-4">Question review</h2>
      <div className="space-y-4">
        {(answers ?? []).map((a, i) => {
          const q = a.questions;
          if (!q) return null;
          return (
            <div key={i} className="clay p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <p className="text-sm">{q.question_text}</p>
                <span className={`text-xs shrink-0 px-2 py-1 rounded-full ${a.is_correct ? "text-sage bg-sage/10" : "text-red-500 bg-red-50"}`}>
                  {a.is_correct ? "Correct" : "Incorrect"}
                </span>
              </div>
              <div className="space-y-1.5">
                {(q.options as string[]).map((opt: string, oi: number) => {
                  const isCorrect = oi === q.correct_index;
                  const isSelected = oi === a.selected_index;
                  let style = "text-ink-faint";
                  if (isCorrect) style = "text-sage font-medium";
                  else if (isSelected) style = "text-red-500";
                  return (
                    <p key={oi} className={`text-xs ${style}`}>
                      {isCorrect ? "✓" : isSelected ? "✗" : "·"} {opt}
                    </p>
                  );
                })}
              </div>
              {q.syllabus_topics?.title && (
                <p className="text-xs text-ink-faint mt-3">Topic: {q.syllabus_topics.title}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

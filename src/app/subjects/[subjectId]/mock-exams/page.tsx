import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MaybeShell } from "@/components/dashboard/MaybeShell";

export default async function MockExamsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { subjectId } = await params;
  const { attemptId } = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: subject } = await supabase.from("subjects").select("*").eq("id", subjectId).single();
  if (!subject) notFound();

  let completedAttempt: { score: number | null; correct_count: number | null; total_questions: number | null; time_taken_seconds: number | null } | null = null;
  let completedExamTitle = "";
  if (attemptId && profile) {
    const { data: attempt } = await supabase
      .from("mock_exam_attempts")
      .select("score, correct_count, total_questions, time_taken_seconds, mock_exams(title)")
      .eq("id", attemptId)
      .eq("student_id", profile.id)
      .not("submitted_at", "is", null)
      .maybeSingle();
    if (attempt) {
      completedAttempt = attempt;
      const examRelation = Array.isArray(attempt.mock_exams) ? attempt.mock_exams[0] : attempt.mock_exams;
      completedExamTitle = examRelation?.title ?? "Mock exam";
    }
  }

  const { data: exams } = await supabase
    .from("mock_exams")
    .select("*, mock_exam_questions(count)")
    .eq("subject_id", subjectId);

  let pastAttempts: Record<string, { score: number; submitted_at: string }[]> = {};
  if (profile) {
    const { data: attempts } = await supabase
      .from("mock_exam_attempts")
      .select("mock_exam_id, score, submitted_at")
      .eq("student_id", profile.id)
      .not("submitted_at", "is", null);
    pastAttempts = (attempts ?? []).reduce((acc, a) => {
      (acc[a.mock_exam_id] ||= []).push({ score: a.score, submitted_at: a.submitted_at });
      return acc;
    }, {} as Record<string, { score: number; submitted_at: string }[]>);
  }

  return (
    <MaybeShell isLoggedIn={!!profile} isStaff={profile ? profile.role !== "student" : false} activeHref="/subjects">
      <Link href={`/subjects/${subjectId}`} className="text-sm text-ink-soft hover:text-ink">
        ← {subject.name}
      </Link>
      <h1 className="text-2xl font-semibold mt-6 mb-1">Mock exams</h1>
      {completedAttempt && (
        <div className="clay p-6 my-6">
          <p className="section-label mb-2">Mock exam complete</p>
          <h2 className="text-lg font-semibold mb-1">{completedExamTitle}</h2>
          <div className="grid grid-cols-3 gap-4 mt-5">
            <div><p className="text-xs text-ink-faint">Score</p><p className="text-2xl font-bold">{completedAttempt.score}%</p></div>
            <div><p className="text-xs text-ink-faint">Correct</p><p className="text-2xl font-bold">{completedAttempt.correct_count}/{completedAttempt.total_questions}</p></div>
            <div><p className="text-xs text-ink-faint">Time</p><p className="text-2xl font-bold">{Math.floor((completedAttempt.time_taken_seconds ?? 0) / 60)}m</p></div>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link href="/skill-insights" className="text-xs text-cobalt border-b border-cobalt/30">View Skill Insights</Link>
            <Link href="/study-plan" className="text-xs text-cobalt border-b border-cobalt/30">Open Study Plan</Link>
          </div>
        </div>
      )}
      <p className="text-ink-soft mb-10 text-sm">
        Timed, exam-style practice for {subject.name}.
      </p>

      {(exams ?? []).length === 0 ? (
        <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
          No mock exams are available for this subject yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {(exams ?? []).map((exam) => {
            const qCount = exam.mock_exam_questions?.[0]?.count ?? 0;
            const attempts = pastAttempts[exam.id] ?? [];
            const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
            return (
              <li key={exam.id} className="clay p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm mb-1">{exam.title}</p>
                  <p className="text-xs text-ink-faint">
                    {qCount} question{qCount === 1 ? "" : "s"} · {exam.duration_minutes} min
                    {bestScore !== null && ` · Best: ${bestScore}%`}
                  </p>
                </div>
                {qCount > 0 && profile ? (
                  <Link
                    href={`/subjects/${subjectId}/mock-exams/${exam.id}`}
                    className="btn-primary px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {attempts.length > 0 ? "Retake" : "Start"}
                  </Link>
                ) : !profile ? (
                  <Link href="/login" className="btn-primary px-4 py-2 rounded-full text-sm font-medium">
                    Sign in
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </MaybeShell>
  );
}

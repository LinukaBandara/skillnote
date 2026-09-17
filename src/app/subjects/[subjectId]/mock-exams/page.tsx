import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MaybeShell } from "@/components/dashboard/MaybeShell";

export default async function MockExamsListPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: subject } = await supabase.from("subjects").select("*").eq("id", subjectId).single();
  if (!subject) notFound();

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

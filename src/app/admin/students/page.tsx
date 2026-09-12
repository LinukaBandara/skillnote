import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const INACTIVITY_THRESHOLD_DAYS = 14;
const LOW_SCORE_THRESHOLD = 50;

export default async function AdminStudentsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();

  let studentsQuery = supabase.from("profiles").select("*").eq("role", "student");
  if (profile.role !== "platform_admin" && profile.institute_id) {
    studentsQuery = studentsQuery.eq("institute_id", profile.institute_id);
  }
  const { data: students } = await studentsQuery;

  const rows = [];

  for (const student of students ?? []) {
    const { data: quizAttempts } = await supabase
      .from("quiz_attempts")
      .select("score, attempted_at")
      .eq("student_id", student.id);

    const { data: questionAttempts } = await supabase
      .from("question_attempts")
      .select("is_correct, attempted_at")
      .eq("student_id", student.id);

    const avgQuizScore =
      (quizAttempts ?? []).length > 0
        ? Math.round(
            (quizAttempts ?? []).reduce((a, q) => a + q.score, 0) / (quizAttempts ?? []).length
          )
        : null;

    const practiceCount = (questionAttempts ?? []).length;
    const practiceAccuracy =
      practiceCount > 0
        ? Math.round(
            ((questionAttempts ?? []).filter((q) => q.is_correct).length / practiceCount) * 100
          )
        : null;

    const allDates = [
      ...(quizAttempts ?? []).map((q) => q.attempted_at),
      ...(questionAttempts ?? []).map((q) => q.attempted_at),
    ];
    const lastActivity = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => new Date(d).getTime()))) : null;

    const daysSinceActivity = lastActivity
      ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const hasActivity = allDates.length > 0;
    const atRisk =
      !hasActivity ||
      (daysSinceActivity !== null && daysSinceActivity > INACTIVITY_THRESHOLD_DAYS) ||
      (avgQuizScore !== null && avgQuizScore < LOW_SCORE_THRESHOLD);

    rows.push({
      id: student.id,
      name: student.full_name ?? student.email,
      avgQuizScore,
      practiceAccuracy,
      practiceCount,
      daysSinceActivity,
      hasActivity,
      atRisk,
    });
  }

  const atRiskCount = rows.filter((r) => r.atRisk).length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="stat-serif text-4xl mb-1">Students</h1>
      <p className="text-ink-soft mb-8 text-sm">
        {rows.length} student{rows.length === 1 ? "" : "s"}
        {atRiskCount > 0 && (
          <span className="text-butter"> · {atRiskCount} may need attention</span>
        )}
      </p>

      {rows.length === 0 ? (
        <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
          No students found for your institute yet.
        </p>
      ) : (
        <table className="w-full text-sm border-t border-rule">
          <thead>
            <tr className="text-left text-xs text-ink-faint border-b border-rule">
              <th className="py-3 font-normal">Student</th>
              <th className="py-3 font-normal">Quiz average</th>
              <th className="py-3 font-normal">Practice accuracy</th>
              <th className="py-3 font-normal">Last activity</th>
              <th className="py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-rule">
                <td className="py-3">{r.name}</td>
                <td className="py-3 text-ink-soft">{r.avgQuizScore !== null ? `${r.avgQuizScore}%` : "—"}</td>
                <td className="py-3 text-ink-soft">
                  {r.practiceAccuracy !== null ? `${r.practiceAccuracy}% (${r.practiceCount})` : "—"}
                </td>
                <td className="py-3 text-ink-soft">
                  {r.hasActivity ? `${r.daysSinceActivity}d ago` : "No activity"}
                </td>
                <td className="py-3">
                  {r.atRisk ? (
                    <span className="text-xs text-butter">Needs attention</span>
                  ) : (
                    <span className="text-xs text-sage">On track</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-xs text-ink-faint mt-6">
        &ldquo;Needs attention&rdquo; means no activity in {INACTIVITY_THRESHOLD_DAYS}+ days, no
        recorded activity yet, or a quiz average below {LOW_SCORE_THRESHOLD}%. This reflects
        platform activity only, not a judgement of the student.
      </p>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";

const readinessLabels: Record<string, string> = {
  starting: "Starting",
  ready: "Ready",
  nearly_ready: "Nearly ready",
  building: "Building",
  needs_revision: "Needs revision",
};

export default async function SkillInsightsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect("/admin");

  const supabase = await createClient();

  await supabase.rpc("refresh_practice_recommendations", { p_student_id: profile.id });

  const { data: readinessRows } = await supabase.rpc("get_mock_readiness", {
    p_student_id: profile.id,
  });
  const readiness = readinessRows?.[0] ?? null;

  const { data: mastery } = await supabase
    .from("learning_outcome_mastery")
    .select("learning_outcome_id, mastery, attempts, recent_attempts, recent_correct, due_at, stage, syllabus_learning_outcomes(statement, syllabus_subtopics(title))")
    .eq("student_id", profile.id)
    .order("mastery", { ascending: true });

  const { data: recommendations } = await supabase
    .from("practice_recommendations")
    .select("id, recommendation_type, priority, reason, target_count, scheduled_for, learning_outcome_id, syllabus_learning_outcomes(statement)")
    .eq("student_id", profile.id)
    .is("completed_at", null)
    .order("priority", { ascending: false })
    .limit(8);

  return (
    <AppShell activeHref="/skill-insights">
      <div className="max-w-4xl px-6 md:px-8 py-10">
        <div className="mb-10">
          <p className="section-label mb-2">Learning intelligence</p>
          <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-2">Skill Insights</h1>
          <p className="text-sm text-ink-soft max-w-xl">
            Your recommendations are derived from question attempts, recent accuracy and spaced-review timing.
          </p>
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-label">Mock readiness</h2>
            <Link href="/study-plan" className="text-xs text-ink-faint hover:text-ink">
              Open study plan
            </Link>
          </div>

          <div className="border border-rule rounded-2xl p-6 md:p-7">
            {readiness ? (
              <>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                  <div>
                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-semibold tracking-[-0.04em]">{readiness.readiness_score}%</span>
                      <span className="text-xs text-ink-faint pb-2 capitalize">
                        {readinessLabels[readiness.readiness_state] ?? readiness.readiness_state}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-3">{readiness.headline}</p>
                    <p className="text-xs text-ink-soft mt-1 max-w-xl">{readiness.guidance}</p>
                  </div>

                  <div className="w-full md:w-48">
                    <div className="flex justify-between text-[11px] text-ink-faint mb-2">
                      <span>Readiness</span>
                      <span>{readiness.readiness_score}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-warm overflow-hidden">
                      <div
                        className="h-full bg-cobalt rounded-full transition-all"
                        style={{ width: `${readiness.readiness_score}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-rule mt-6 pt-5">
                  <div>
                    <p className="text-[11px] text-ink-faint mb-1">Syllabus covered</p>
                    <p className="text-lg font-semibold">{readiness.coverage_percent}%</p>
                    <p className="text-[11px] text-ink-faint">{readiness.attempted_outcomes}/{readiness.total_outcomes} outcomes</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-faint mb-1">Mastery</p>
                    <p className="text-lg font-semibold">{readiness.mastery_percent}%</p>
                    <p className="text-[11px] text-ink-faint">{readiness.mastered_outcomes} mastered</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-faint mb-1">Recent accuracy</p>
                    <p className="text-lg font-semibold">
                      {readiness.recent_attempts > 0 ? `${readiness.recent_accuracy_percent}%` : "—"}
                    </p>
                    <p className="text-[11px] text-ink-faint">
                      {readiness.recent_attempts > 0 ? `${readiness.recent_attempts} recent attempts` : "Practice to establish a trend"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-faint mb-1">Due revision</p>
                    <p className="text-lg font-semibold">{readiness.due_outcomes}</p>
                    <p className="text-[11px] text-ink-faint">
                      {readiness.recent_mock_count > 0 ? `Mock avg ${readiness.recent_mock_score}%` : "No completed mock yet"}
                    </p>
                  </div>
                </div>

                {(readiness.review_outcomes > 0 || readiness.developing_outcomes > 0) && (
                  <div className="border-t border-rule mt-5 pt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-soft">
                    <span>{readiness.review_outcomes} need revision</span>
                    <span>{readiness.developing_outcomes} developing</span>
                    <span>{readiness.mastered_outcomes} mastered</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-ink-soft border-l-2 border-rule pl-4 py-1">
                Complete some practice questions and Skill Note will build your mock-readiness profile.
              </p>
            )}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-label">Recommended next</h2>
            <Link href="/subjects" className="text-xs text-ink-faint hover:text-ink">Browse subjects</Link>
          </div>
          {(recommendations ?? []).length === 0 ? (
            <p className="text-sm text-ink-soft border-l-2 border-rule pl-4 py-1">
              Complete some practice questions and Skill Note will build recommendations from your real performance.
            </p>
          ) : (
            <div className="border-t border-rule">
              {(recommendations ?? []).map((item) => {
                const outcome = Array.isArray(item.syllabus_learning_outcomes)
                  ? item.syllabus_learning_outcomes[0]
                  : item.syllabus_learning_outcomes;

                return (
                  <div key={item.id} className="border-b border-rule py-4 flex items-start justify-between gap-5">
                    <div>
                      <p className="text-sm font-medium">{outcome?.statement ?? "Learning outcome"}</p>
                      <p className="text-xs text-ink-soft mt-1">{item.reason}</p>
                    </div>
                    <span className="text-xs text-ink-faint capitalize whitespace-nowrap">{item.recommendation_type}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="section-label mb-4">Outcome mastery</h2>
          {(mastery ?? []).length === 0 ? (
            <p className="text-sm text-ink-soft border-l-2 border-rule pl-4 py-1">No outcome mastery has been established yet.</p>
          ) : (
            <div className="border-t border-rule">
              {(mastery ?? []).map((item) => {
                const outcome = Array.isArray(item.syllabus_learning_outcomes)
                  ? item.syllabus_learning_outcomes[0]
                  : item.syllabus_learning_outcomes;

                return (
                  <div key={item.learning_outcome_id} className="border-b border-rule py-4">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div>
                        <p className="text-sm font-medium">{outcome?.statement ?? "Learning outcome"}</p>
                        <p className="text-xs text-ink-faint mt-1 capitalize">{item.stage} · {item.attempts} attempts</p>
                      </div>
                      <span className="text-sm font-semibold">{item.mastery}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-warm overflow-hidden">
                      <div className="h-full bg-cobalt rounded-full" style={{ width: `${item.mastery}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

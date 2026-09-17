import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";

export default async function SkillInsightsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect("/admin");

  const supabase = await createClient();

  await supabase.rpc("refresh_practice_recommendations", { p_student_id: profile.id });

  const { data: mastery } = await supabase
    .from("learning_outcome_mastery")
    .select("learning_outcome_id, mastery, attempts, recent_attempts, recent_correct, due_at, stage, syllabus_learning_outcomes(title, syllabus_subtopics(title))")
    .eq("student_id", profile.id)
    .order("mastery", { ascending: true });

  const { data: recommendations } = await supabase
    .from("practice_recommendations")
    .select("id, recommendation_type, priority, reason, target_count, scheduled_for, learning_outcome_id, syllabus_learning_outcomes(title)")
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
                const outcome = Array.isArray(item.syllabus_learning_outcomes) ? item.syllabus_learning_outcomes[0] : item.syllabus_learning_outcomes;
                return (
                  <div key={item.id} className="border-b border-rule py-4 flex items-start justify-between gap-5">
                    <div>
                      <p className="text-sm font-medium">{outcome?.title ?? "Learning outcome"}</p>
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
                const outcome = Array.isArray(item.syllabus_learning_outcomes) ? item.syllabus_learning_outcomes[0] : item.syllabus_learning_outcomes;
                return (
                  <div key={item.learning_outcome_id} className="border-b border-rule py-4">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div>
                        <p className="text-sm font-medium">{outcome?.title ?? "Learning outcome"}</p>
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

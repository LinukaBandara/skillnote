import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";

function daysUntilExam(alYear: number) {
  const examDate = new Date(`${alYear}-08-01T00:00:00`);
  const now = new Date();
  return Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const GRADIENT_CARDS = ["gradient-card-1", "gradient-card-2", "gradient-card-3"];

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect("/admin");
  if (!profile.al_year) redirect("/onboarding");

  const supabase = await createClient();

  const { data: studentSubjects } = await supabase
    .from("student_subjects")
    .select("subject_id, subjects(id, name)")
    .eq("student_id", profile.id);

  const subjects = (studentSubjects ?? [])
    .map((row) => row.subjects)
    .flat() as { id: string; name: string }[];

  const subjectProgress: { id: string; name: string; percent: number; topicCount: number }[] = [];
  const revisionNeeded: { subject: string; topic: string }[] = [];
  const activity: { subject: string; topic: string; percent: number; status: string; updatedAt: string }[] = [];

  for (const subject of subjects) {
    const { data: topics } = await supabase
      .from("syllabus_topics")
      .select("id, title, syllabus_units!inner(subject_id)")
      .eq("syllabus_units.subject_id", subject.id);

    const topicIds = (topics ?? []).map((t) => t.id);

    let percent = 0;
    if (topicIds.length > 0) {
      const { data: progressRows } = await supabase
        .from("topic_progress")
        .select("topic_id, status, percent, updated_at")
        .eq("student_id", profile.id)
        .in("topic_id", topicIds);

      const sum = (progressRows ?? []).reduce((acc, r) => acc + (r.percent ?? 0), 0);
      percent = Math.round(sum / topicIds.length);

      for (const row of progressRows ?? []) {
        const topic = (topics ?? []).find((t) => t.id === row.topic_id);
        if (!topic) continue;
        if (row.status === "weak" || row.status === "needs_revision") {
          revisionNeeded.push({ subject: subject.name, topic: topic.title });
        }
        activity.push({
          subject: subject.name,
          topic: topic.title,
          percent: row.percent,
          status: row.status,
          updatedAt: row.updated_at,
        });
      }
    }

    subjectProgress.push({ id: subject.id, name: subject.name, percent, topicCount: topicIds.length });
  }

  activity.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const recentActivity = activity.slice(0, 5);

  // Skill insight + revision queue, derived from the mastery table (real attempt history).
  let skillInsight: { topic: string; mastery: number; attempts: number } | null = null;
  let dueCount = 0;

  const { data: masteryRows } = await supabase
    .from("topic_mastery")
    .select("mastery, attempts, due_at, syllabus_topics(title)")
    .eq("student_id", profile.id)
    .order("mastery", { ascending: true });

  for (const row of masteryRows ?? []) {
    if (new Date(row.due_at) <= new Date()) dueCount++;
    if (!skillInsight && row.attempts >= 3) {
      const t = Array.isArray(row.syllabus_topics) ? row.syllabus_topics[0] : row.syllabus_topics;
      skillInsight = {
        topic: (t as { title?: string } | null)?.title ?? "a topic",
        mastery: row.mastery,
        attempts: row.attempts,
      };
    }
  }

  const daysLeft = daysUntilExam(profile.al_year);
  const firstName = profile.full_name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", weekday: "long" });

  const continueHref = subjects.length > 0 ? `/subjects/${subjects[0].id}` : "/subjects";

  return (
    <AppShell activeHref="/dashboard">
      <div className="grid lg:grid-cols-[1fr_280px]">
            {/* Main column */}
            <div className="p-6 md:p-8 border-r border-rule min-w-0">
              {/* Search + date */}
              <div className="flex items-center justify-between gap-4 mb-8">
                <form action="/search" className="flex-1 max-w-sm">
                  <div className="flex items-center gap-2 bg-bg-warm rounded-full px-4 py-2.5">
                    <svg className="w-4 h-4 text-ink-faint shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                    </svg>
                    <input
                      name="q"
                      placeholder="Search subjects, topics..."
                      className="bg-transparent text-sm w-full focus:outline-none placeholder:text-ink-faint"
                    />
                  </div>
                </form>
                <span className="hidden sm:block text-xs text-ink-faint whitespace-nowrap">{today}</span>
              </div>

              {/* Hero */}
              <div className="clay p-7 mb-8 flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-[25px] font-semibold mb-1.5 tracking-[-0.025em]">Good to see you, {firstName}!</h1>
                  <p className="text-ink-soft text-sm mb-5 max-w-sm">
                    Ready to continue your A/L journey? Keep your progress moving forward.
                  </p>
                  <Link href={continueHref} className="btn-primary inline-block px-5 py-2.5 rounded-full text-sm font-medium">
                    Continue learning →
                  </Link>
                </div>
                <div className="hidden sm:flex shrink-0">
                  <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
                    <rect x="20" y="50" width="70" height="12" rx="4" fill="var(--lilac)" opacity="0.35" />
                    <rect x="28" y="30" width="60" height="24" rx="6" fill="var(--cobalt)" opacity="0.85" />
                    <rect x="34" y="36" width="30" height="4" rx="2" fill="white" opacity="0.8" />
                    <rect x="34" y="44" width="42" height="4" rx="2" fill="white" opacity="0.6" />
                    <rect x="14" y="66" width="92" height="10" rx="4" fill="var(--butter)" opacity="0.5" />
                    <circle cx="98" cy="26" r="10" fill="var(--lilac)" opacity="0.5" />
                  </svg>
                </div>
              </div>

              {/* My Subjects */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-label">My Subjects</h2>
                <Link href="/onboarding" className="text-xs text-ink-faint hover:text-ink">
                  Edit
                </Link>
              </div>

              {subjectProgress.length === 0 ? (
                <div className="border border-dashed border-rule rounded-2xl p-8 text-center mb-8">
                  <p className="text-ink-soft text-sm mb-4">You haven&rsquo;t selected any subjects yet.</p>
                  <Link href="/onboarding" className="btn-primary inline-block px-5 py-2.5 rounded-full text-sm font-medium">
                    Choose subjects
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-3 gap-4 mb-10">
                  {subjectProgress.slice(0, 3).map((s, i) => (
                    <Link
                      key={s.id}
                      href={`/subjects/${s.id}`}
                      className={`p-5 ${GRADIENT_CARDS[i % GRADIENT_CARDS.length]}`}
                    >
                      <p className="text-sm font-semibold mb-6">{s.name}</p>
                      <div className="flex items-end justify-between mb-2">
                        <p className="text-[26px] font-bold tracking-[-0.03em]">{s.topicCount > 0 ? `${s.percent}%` : "—"}</p>
                        <p className="text-xs opacity-80">Progress</p>
                      </div>
                      {s.topicCount > 0 && (
                        <div className="highlight-bar-light" style={{ ["--pct" as string]: `${s.percent}%` }} />
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* Continue Learning table */}
              <h2 className="section-label mb-4">Continue Learning</h2>
              {recentActivity.length === 0 ? (
                <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
                  No recent activity yet — mark a topic&rsquo;s status in your syllabus tracker to see it here.
                </p>
              ) : (
                <div className="border-t border-rule">
                  <div className="grid grid-cols-[1.5fr_1.5fr_0.8fr_1fr_0.8fr] text-xs text-ink-faint py-2 border-b border-rule">
                    <span>Subject</span>
                    <span>Topic</span>
                    <span>Progress</span>
                    <span>Last studied</span>
                    <span></span>
                  </div>
                  {recentActivity.map((a, i) => (
                    <div key={i} className="grid grid-cols-[1.5fr_1.5fr_0.8fr_1fr_0.8fr] text-sm py-3 border-b border-rule items-center">
                      <span>{a.subject}</span>
                      <span className="text-ink-soft">{a.topic}</span>
                      <span className="text-ink-soft">{a.percent}%</span>
                      <span className="text-ink-faint text-xs">
                        {new Date(a.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-cobalt text-xs font-medium">
                        {a.status === "completed" ? "Review" : "Continue"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="p-6 md:p-7 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-cobalt/10 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-xl font-semibold text-cobalt">
                    {(profile.full_name ?? "S")[0].toUpperCase()}
                  </span>
                </div>
                <p className="font-medium text-sm">{profile.full_name}</p>
                <p className="section-label mb-3">A/L {profile.al_year}</p>
                <Link href="/onboarding" className="text-xs btn-primary inline-block px-4 py-2 rounded-full font-medium">
                  View profile
                </Link>
              </div>

              <div className="border-t border-rule pt-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-ink-faint">A/L {profile.al_year}</span>
                  <span className="w-2 h-2 rounded-full bg-butter" />
                </div>
                <p className="text-2xl font-bold">
                  {daysLeft > 0 ? daysLeft : 0} <span className="text-xs font-normal text-ink-faint uppercase tracking-wide">days left</span>
                </p>
              </div>

              <div className="border-t border-rule pt-6">
                <MiniCalendar />
              </div>

              <div className="border-t border-rule pt-6">
                <p className="text-sm font-medium mb-3">✦ Skill Insight</p>
                {skillInsight ? (
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Your weakest tracked topic is{" "}
                    <span className="text-ink font-medium">{skillInsight.topic}</span> at{" "}
                    <span className="text-ink font-medium">{skillInsight.mastery}% mastery</span> over{" "}
                    {skillInsight.attempts} questions.
                    {dueCount > 0 && ` ${dueCount} topic${dueCount === 1 ? " is" : "s are"} due for revision.`}
                  </p>
                ) : (
                  <p className="text-xs text-ink-faint leading-relaxed">
                    Answer a few practice questions and Skill Note will start surfacing insights here.
                  </p>
                )}
              </div>

              <div className="border-t border-rule pt-6">
                <p className="text-sm font-medium mb-3">Needs revision</p>
                {revisionNeeded.length === 0 ? (
                  <p className="text-xs text-ink-faint">
                    Nothing flagged. Mark topics &ldquo;weak&rdquo; or &ldquo;needs revision&rdquo; in the syllabus tracker.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {revisionNeeded.slice(0, 4).map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-butter mt-1 shrink-0" />
                        <span>
                          <span className="text-ink">{r.topic}</span>
                          <span className="text-ink-faint"> · {r.subject}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-rule pt-6">
                <p className="text-sm font-medium mb-2">Upcoming</p>
                <p className="text-xs text-ink-faint leading-relaxed">
                  Assignments and mock exam deadlines will appear here once your institute schedules them.
                </p>
              </div>
            </div>
          </div>
    </AppShell>
  );
}

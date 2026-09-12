import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";

function daysUntilExam(alYear: number) {
  // A/L written papers typically fall in Q3; use Aug 1 of the exam year as a placeholder target.
  const examDate = new Date(`${alYear}-08-01T00:00:00`);
  const now = new Date();
  const diff = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

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
        .select("topic_id, status, percent")
        .eq("student_id", profile.id)
        .in("topic_id", topicIds);

      const sum = (progressRows ?? []).reduce((acc, r) => acc + (r.percent ?? 0), 0);
      percent = topicIds.length > 0 ? Math.round(sum / topicIds.length) : 0;

      for (const row of progressRows ?? []) {
        if (row.status === "weak" || row.status === "needs_revision") {
          const topic = (topics ?? []).find((t) => t.id === row.topic_id);
          if (topic) revisionNeeded.push({ subject: subject.name, topic: topic.title });
        }
      }
    }

    subjectProgress.push({ id: subject.id, name: subject.name, percent, topicCount: topicIds.length });
  }

  const daysLeft = daysUntilExam(profile.al_year);
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-6xl mx-auto px-6 flex gap-8">
      <DashboardSidebar activeHref="/dashboard" />

      <div className="flex-1 min-w-0 py-8 grid lg:grid-cols-[1fr_280px] gap-8">
        {/* Main column */}
        <div>
          <div className="clay p-7 mb-8 flex items-center justify-between gap-6">
            <div>
              <h1 className="stat-serif text-3xl mb-1.5">Good to see you, {firstName}.</h1>
              <p className="text-ink-soft text-sm">Ready to continue your A/L journey?</p>
            </div>
            <div className="hidden sm:block text-right shrink-0">
              <p className="text-xs text-ink-faint mb-0.5">G.C.E. A/L {profile.al_year}</p>
              <p className="stat-serif text-2xl text-cobalt">
                {daysLeft > 0 ? `${daysLeft} days` : "Exam window"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-ink-soft">Your subjects</h2>
            <Link href="/onboarding" className="text-xs text-ink-faint hover:text-ink">
              Edit subjects
            </Link>
          </div>

          {subjectProgress.length === 0 ? (
            <div className="border border-dashed border-rule rounded-2xl p-8 text-center">
              <p className="text-ink-soft text-sm mb-4">You haven&rsquo;t selected any subjects yet.</p>
              <Link href="/onboarding" className="btn-primary inline-block px-5 py-2.5 rounded-full text-sm font-medium">
                Choose subjects
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {subjectProgress.map((s) => (
                <Link
                  key={s.id}
                  href={`/subjects/${s.id}`}
                  className="clay p-5 hover:border-cobalt/30 transition-colors block"
                >
                  <div className="flex justify-between text-sm mb-3">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-ink-faint">{s.topicCount > 0 ? `${s.percent}%` : "—"}</span>
                  </div>
                  {s.topicCount > 0 ? (
                    <div className="highlight-bar" style={{ ["--pct" as string]: `${s.percent}%` }} />
                  ) : (
                    <p className="text-xs text-ink-faint">No syllabus content yet</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-6">
          <div className="clay p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-cobalt/10 mx-auto mb-3 flex items-center justify-center">
              <span className="stat-serif text-xl text-cobalt">
                {(profile.full_name ?? "S")[0].toUpperCase()}
              </span>
            </div>
            <p className="font-medium text-sm">{profile.full_name}</p>
            <p className="text-xs text-ink-faint capitalize">{profile.role} · {profile.medium}</p>
          </div>

          <div className="clay p-6">
            <MiniCalendar />
          </div>

          <div className="clay p-6">
            <p className="text-sm font-medium mb-3">Needs revision</p>
            {revisionNeeded.length === 0 ? (
              <p className="text-xs text-ink-faint">
                Nothing flagged yet — mark topics as &ldquo;weak&rdquo; or &ldquo;needs revision&rdquo; in your syllabus tracker and they&rsquo;ll show up here.
              </p>
            ) : (
              <ul className="space-y-3">
                {revisionNeeded.slice(0, 5).map((r, i) => (
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
        </div>
      </div>
    </div>
  );
}

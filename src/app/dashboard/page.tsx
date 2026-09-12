import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import Link from "next/link";

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

  // Compute per-subject progress from topic_progress
  const subjectProgress: { id: string; name: string; percent: number; topicCount: number }[] = [];

  for (const subject of subjects) {
    const { data: topics } = await supabase
      .from("syllabus_topics")
      .select("id, syllabus_units!inner(subject_id)")
      .eq("syllabus_units.subject_id", subject.id);

    const topicIds = (topics ?? []).map((t) => t.id);

    let percent = 0;
    if (topicIds.length > 0) {
      const { data: progressRows } = await supabase
        .from("topic_progress")
        .select("percent")
        .eq("student_id", profile.id)
        .in("topic_id", topicIds);

      const sum = (progressRows ?? []).reduce((acc, r) => acc + (r.percent ?? 0), 0);
      percent = Math.round(sum / topicIds.length);
    }

    subjectProgress.push({ id: subject.id, name: subject.name, percent, topicCount: topicIds.length });
  }

  const daysLeft = daysUntilExam(profile.al_year);
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="stat-serif text-4xl mb-1">Good to see you, {firstName}.</h1>
      <p className="text-ink-soft text-sm mb-10">Ready to continue your A/L journey?</p>

      <div className="clay p-6 mb-10 flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-soft">G.C.E. A/L {profile.al_year}</p>
          <p className="stat-serif text-3xl text-ink mt-1">
            {daysLeft > 0 ? `${daysLeft} days remaining` : "Exam window has begun"}
          </p>
        </div>
        <Link href="/onboarding" className="text-sm text-ink-soft hover:text-ink border-b border-rule hover:border-ink pb-0.5">
          Edit
        </Link>
      </div>

      <h2 className="text-sm font-medium text-ink-soft mb-4">Your subjects</h2>

      {subjectProgress.length === 0 ? (
        <div className="border border-dashed border-rule rounded-2xl p-8 text-center">
          <p className="text-ink-soft text-sm mb-4">You haven&rsquo;t selected any subjects yet.</p>
          <Link href="/onboarding" className="btn-primary inline-block px-5 py-2.5 rounded-full text-sm font-medium">
            Choose subjects
          </Link>
        </div>
      ) : (
        <ul className="border-t border-rule">
          {subjectProgress.map((s) => (
            <li key={s.id} className="border-b border-rule py-5">
              <Link href={`/subjects/${s.id}`} className="flex items-center justify-between group">
                <div className="flex-1 pr-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium group-hover:text-cobalt transition-colors">{s.name}</span>
                    <span className="text-ink-faint">{s.topicCount > 0 ? `${s.percent}%` : "No syllabus yet"}</span>
                  </div>
                  {s.topicCount > 0 && (
                    <div className="highlight-bar" style={{ ["--pct" as string]: `${s.percent}%` }} />
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

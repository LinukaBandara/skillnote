import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { MaybeShell } from "@/components/dashboard/MaybeShell";
import type { Stream, Subject } from "@/types/db";

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: streams } = await supabase.from("streams").select("*").order("name");
  const { data: subjects } = await supabase.from("subjects").select("*").order("name");
  const { data: subjectStreamRows } = await supabase
    .from("subject_streams")
    .select("subject_id, stream_id");

  const streamList = (streams ?? []) as Stream[];
  let subjectList = (subjects ?? []) as Subject[];
  const streamIdsBySubject = new Map<string, Set<string>>();
  for (const row of subjectStreamRows ?? []) {
    const ids = streamIdsBySubject.get(row.subject_id) ?? new Set<string>();
    ids.add(row.stream_id);
    streamIdsBySubject.set(row.subject_id, ids);
  }

  if (q) {
    subjectList = subjectList.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  }

  return (
    <MaybeShell isLoggedIn={!!profile} isStaff={profile ? profile.role !== "student" : false} activeHref="/subjects">
      <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Subjects</h1>
      <p className="text-ink-soft mb-12 text-sm">
        {q ? `Results for "${q}"` : "Browse the A/L syllabus by stream."}
      </p>

      <div className="space-y-10">
        {subjectList.length === 0 ? (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
            No subjects match &ldquo;{q}&rdquo;.
          </p>
        ) : (
          streamList.map((stream) => {
          const streamSubjects = subjectList.filter((s) => streamIdsBySubject.get(s.id)?.has(stream.id));
          if (streamSubjects.length === 0) return null;
          return (
            <div key={stream.id}>
              <h2 className="section-label mb-3">{stream.name}</h2>
              <ul className="border-t border-rule">
                {streamSubjects.map((subject) => (
                  <li key={subject.id} className="border-b border-rule">
                    <Link
                      href={`/subjects/${subject.id}`}
                      className="flex items-center justify-between py-4 group"
                    >
                      <span className="text-base font-medium group-hover:text-cobalt transition-colors">
                        {subject.name}
                      </span>
                      <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">
                        View syllabus
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
          })
        )}
      </div>
    </MaybeShell>
  );
}

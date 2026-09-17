import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { updateTopicStatus } from "../actions";
import type { TopicStatus } from "@/types/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MaybeShell } from "@/components/dashboard/MaybeShell";
import { languageFallbackChain } from "@/types/language";

const STATUS_LABELS: Record<TopicStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  weak: "Weak",
  needs_revision: "Needs revision",
  completed: "Completed",
};

const STATUS_ORDER: TopicStatus[] = [
  "not_started",
  "in_progress",
  "needs_revision",
  "weak",
  "completed",
];

const STATUS_DOT: Record<TopicStatus, string> = {
  not_started: "bg-rule",
  in_progress: "bg-cobalt",
  needs_revision: "bg-butter",
  weak: "bg-red-400",
  completed: "bg-sage",
};

function localizedValue(
  rows: { language_code: string; title?: string | null; description?: string | null }[] | null,
  language: "en" | "si" | "ta",
  fallback: string,
) {
  for (const code of languageFallbackChain(language)) {
    const row = rows?.find((item) => item.language_code === code);
    const value = row?.title ?? row?.description;
    if (value) return value;
  }
  return fallback;
}

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const language = profile?.preferred_language ?? "en";

  const { data: subject } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", subjectId)
    .single();

  if (!subject) notFound();

  const { data: units } = await supabase
    .from("syllabus_units")
    .select("*, syllabus_topics(*)")
    .eq("subject_id", subjectId)
    .order("position");

  const unitIds = (units ?? []).map((unit) => unit.id);
  const topicIds = (units ?? []).flatMap((unit) => (unit.syllabus_topics ?? []).map((topic: { id: string }) => topic.id));

  const [{ data: unitTranslations }, { data: topicTranslations }] = await Promise.all([
    unitIds.length
      ? supabase.from("syllabus_unit_translations").select("unit_id, language_code, title").in("unit_id", unitIds)
      : Promise.resolve({ data: [] }),
    topicIds.length
      ? supabase.from("syllabus_topic_translations").select("topic_id, language_code, title").in("topic_id", topicIds)
      : Promise.resolve({ data: [] }),
  ]);

  const unitTranslationMap = new Map<string, typeof unitTranslations>();
  for (const row of unitTranslations ?? []) {
    const existing = unitTranslationMap.get(row.unit_id) ?? [];
    existing.push(row);
    unitTranslationMap.set(row.unit_id, existing);
  }

  const topicTranslationMap = new Map<string, typeof topicTranslations>();
  for (const row of topicTranslations ?? []) {
    const existing = topicTranslationMap.get(row.topic_id) ?? [];
    existing.push(row);
    topicTranslationMap.set(row.topic_id, existing);
  }

  let progressMap = new Map<string, TopicStatus>();
  if (profile) {
    if (topicIds.length > 0) {
      const { data: progress } = await supabase
        .from("topic_progress")
        .select("topic_id, status")
        .eq("student_id", profile.id)
        .in("topic_id", topicIds);

      progressMap = new Map((progress ?? []).map((p) => [p.topic_id, p.status as TopicStatus]));
    }
  }

  return (
    <MaybeShell isLoggedIn={!!profile} isStaff={profile ? profile.role !== "student" : false} activeHref="/subjects">
      <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">{subject.name}</h1>
      <div className="flex items-center justify-between mb-10">
        <p className="text-ink-soft text-sm">Track your progress through each topic.</p>
        <div className="flex items-center gap-4">
          <Link href={`/subjects/${subjectId}/mock-exams`} className="text-sm text-ink-soft border-b border-rule hover:border-ink pb-0.5">Mock exams</Link>
          <Link href={`/subjects/${subjectId}/practice`} className="text-sm text-cobalt border-b border-cobalt/30 hover:border-cobalt pb-0.5">Practice questions →</Link>
        </div>
      </div>

      {(units ?? []).length === 0 ? (
        <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">Syllabus content for this subject hasn&rsquo;t been added yet.</p>
      ) : (
        <div className="space-y-10">
          {(units ?? []).map((unit) => (
            <div key={unit.id}>
              <h2 className="section-label mb-3">
                {localizedValue(unitTranslationMap.get(unit.id) ?? null, language, unit.title)}
              </h2>
              <ul className="border-t border-rule">
                {(unit.syllabus_topics ?? [])
                  .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
                  .map((topic: { id: string; title: string }) => {
                    const status = progressMap.get(topic.id) ?? "not_started";
                    return (
                      <li key={topic.id} className="border-b border-rule py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                          <span className="text-sm">{localizedValue(topicTranslationMap.get(topic.id) ?? null, language, topic.title)}</span>
                        </div>
                        {profile ? (
                          <form action={async (formData: FormData) => {
                            "use server";
                            const newStatus = formData.get("status") as TopicStatus;
                            await updateTopicStatus(topic.id, subjectId, newStatus);
                          }}>
                            <select name="status" defaultValue={status} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="text-xs text-ink-soft bg-transparent border border-rule rounded-full px-3 py-1.5 focus:outline-none focus:border-cobalt">
                              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                            </select>
                          </form>
                        ) : (
                          <span className="text-xs text-ink-faint">{STATUS_LABELS[status]}</span>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </MaybeShell>
  );
}

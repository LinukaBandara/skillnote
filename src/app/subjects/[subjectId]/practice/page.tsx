import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { MaybeShell } from "@/components/dashboard/MaybeShell";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PracticeClient } from "./PracticeClient";
import { PracticeFilters } from "./PracticeFilters";

type Mode = "all" | "adaptive" | "weak" | "revision";

const MODES: { key: Mode; label: string; blurb: string }[] = [
  { key: "all", label: "All questions", blurb: "Every question for this subject." },
  { key: "adaptive", label: "Adaptive", blurb: "Difficulty matched to your current mastery." },
  { key: "weak", label: "Weak areas", blurb: "Topics where your mastery is below 50%." },
  { key: "revision", label: "Due for revision", blurb: "Topics scheduled for review today." },
];

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ topic?: string; year?: string; difficulty?: string; mode?: string }>;
}) {
  const { subjectId } = await params;
  const { topic, year, difficulty, mode: modeParam } = await searchParams;
  const mode = (MODES.find((m) => m.key === modeParam)?.key ?? "all") as Mode;

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: subject } = await supabase.from("subjects").select("*").eq("id", subjectId).single();
  if (!subject) notFound();

  const { data: topics } = await supabase
    .from("syllabus_topics")
    .select("id, title, syllabus_units!inner(subject_id)")
    .eq("syllabus_units.subject_id", subjectId);

  const subjectTopicIds = (topics ?? []).map((t) => t.id);

  const { data: yearsRaw } = await supabase
    .from("questions")
    .select("year")
    .eq("subject_id", subjectId)
    .not("year", "is", null);
  const years = Array.from(new Set((yearsRaw ?? []).map((r) => r.year))).sort(
    (a, b) => (b ?? 0) - (a ?? 0)
  );

  // Mastery drives the adaptive / weak / revision modes. Real data only —
  // if the student has no history these modes fall back to an explicit empty state.
  let mastery: { topic_id: string; mastery: number; due_at: string }[] = [];
  if (profile && subjectTopicIds.length > 0) {
    const { data } = await supabase
      .from("topic_mastery")
      .select("topic_id, mastery, due_at")
      .eq("student_id", profile.id)
      .in("topic_id", subjectTopicIds);
    mastery = data ?? [];
  }

  const avgMastery =
    mastery.length > 0
      ? Math.round(mastery.reduce((a, m) => a + m.mastery, 0) / mastery.length)
      : null;

  let query = supabase.from("questions").select("*").eq("subject_id", subjectId);
  if (topic) query = query.eq("topic_id", topic);
  if (year) query = query.eq("year", Number(year));
  if (difficulty) query = query.eq("difficulty", difficulty);

  if (mode === "adaptive" && avgMastery !== null) {
    // Below 50% mastery → reinforce with easier questions; strong → push harder.
    const target = avgMastery < 50 ? "easy" : avgMastery < 75 ? "medium" : "hard";
    query = query.eq("difficulty", target);
  } else if (mode === "weak") {
    const weakTopics = mastery.filter((m) => m.mastery < 50).map((m) => m.topic_id);
    query = weakTopics.length > 0 ? query.in("topic_id", weakTopics) : query.eq("topic_id", "00000000-0000-0000-0000-000000000000");
  } else if (mode === "revision") {
    const dueTopics = mastery.filter((m) => new Date(m.due_at) <= new Date()).map((m) => m.topic_id);
    query = dueTopics.length > 0 ? query.in("topic_id", dueTopics) : query.eq("topic_id", "00000000-0000-0000-0000-000000000000");
  }

  const { data: questions } = await query;

  const activeMode = MODES.find((m) => m.key === mode)!;

  const buildHref = (m: Mode) => {
    const usp = new URLSearchParams();
    if (m !== "all") usp.set("mode", m);
    if (topic) usp.set("topic", topic);
    if (year) usp.set("year", year);
    if (difficulty) usp.set("difficulty", difficulty);
    const qs = usp.toString();
    return `/subjects/${subjectId}/practice${qs ? `?${qs}` : ""}`;
  };

  return (
    <MaybeShell isLoggedIn={!!profile} isStaff={profile ? profile.role !== "student" : false} activeHref="/practice">
      <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">{subject.name} practice</h1>
      <p className="text-ink-soft mb-6 text-sm">{activeMode.blurb}</p>

      {profile && (
        <div className="flex flex-wrap gap-2 mb-6">
          {MODES.map((m) => (
            <Link
              key={m.key}
              href={buildHref(m.key)}
              className={`text-xs px-3.5 py-2 rounded-full border transition-colors ${
                m.key === mode
                  ? "bg-ink text-white border-ink"
                  : "border-rule text-ink-soft hover:border-ink-faint"
              }`}
            >
              {m.label}
            </Link>
          ))}
        </div>
      )}

      {profile && avgMastery !== null && (
        <div className="clay p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="section-label mb-1">Your mastery in {subject.name}</p>
            <p className="text-xs text-ink-faint">
              Based on {mastery.length} tracked topic{mastery.length === 1 ? "" : "s"}
            </p>
          </div>
          <p className="text-[22px] font-bold tracking-[-0.03em]">{avgMastery}%</p>
        </div>
      )}

      <PracticeFilters
        subjectId={subjectId}
        topics={(topics ?? []).map((t) => ({ id: t.id, title: t.title }))}
        years={years.filter((y): y is number => y !== null)}
        current={{ topic, year, difficulty }}
      />

      <div className="mt-8">
        <PracticeClient
          key={`${mode}-${topic ?? ""}-${year ?? ""}-${difficulty ?? ""}`}
          questions={
            (questions ?? []) as unknown as {
              id: string;
              question_text: string;
              options: string[];
              correct_index: number;
              year: number | null;
              difficulty: string;
              source: string | null;
            }[]
          }
          subjectId={subjectId}
        />
      </div>
    </MaybeShell>
  );
}

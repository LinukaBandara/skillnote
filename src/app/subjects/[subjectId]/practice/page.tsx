import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { MaybeShell } from "@/components/dashboard/MaybeShell";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PracticeClient } from "./PracticeClient";
import { PracticeFilters } from "./PracticeFilters";
import { languageFallbackChain } from "@/types/language";

type Mode = "all" | "adaptive" | "weak" | "revision";
type QuestionForClient = { id: string; question_text: string; options: string[]; correct_index: number; year: number | null; difficulty: string; source: string | null };
const MODES: { key: Mode; label: string; blurb: string }[] = [
  { key: "all", label: "All questions", blurb: "Every question for this subject." },
  { key: "adaptive", label: "Adaptive", blurb: "Difficulty matched to your current mastery." },
  { key: "weak", label: "Weak areas", blurb: "Topics where your mastery is below 50%." },
  { key: "revision", label: "Due for revision", blurb: "Topics scheduled for review today." },
];
function localizedTitle(rows: { language_code: string; title: string | null }[] | null, language: "en" | "si" | "ta", fallback: string) {
  for (const code of languageFallbackChain(language)) { const row = rows?.find((item) => item.language_code === code); if (row?.title) return row.title; }
  return fallback;
}
function localizedQuestion(question: { id: string; question_text: string; options: unknown; correct_index: number; year: number | null; difficulty: string; source: string | null }, rows: { language_code: string; question_text: string | null; options: unknown }[] | undefined, language: "en" | "si" | "ta"): QuestionForClient {
  const translation = languageFallbackChain(language).map((code) => rows?.find((row) => row.language_code === code)).find((row) => row?.question_text);
  const options = Array.isArray(translation?.options) && translation.options.every((item) => typeof item === "string") ? translation.options as string[] : Array.isArray(question.options) && question.options.every((item) => typeof item === "string") ? question.options as string[] : [];
  return { id: question.id, question_text: translation?.question_text ?? question.question_text, options, correct_index: question.correct_index, year: question.year, difficulty: question.difficulty, source: question.source };
}
export default async function PracticePage({ params, searchParams }: { params: Promise<{ subjectId: string }>; searchParams: Promise<{ topic?: string; year?: string; difficulty?: string; mode?: string }> }) {
  const { subjectId } = await params;
  const { topic, year, difficulty, mode: modeParam } = await searchParams;
  const mode = (MODES.find((m) => m.key === modeParam)?.key ?? "all") as Mode;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const language = profile?.preferred_language ?? "en";
  const { data: subject } = await supabase.from("subjects").select("*").eq("id", subjectId).single();
  if (!subject) notFound();
  const { data: topics } = await supabase.from("syllabus_topics").select("id, title, syllabus_units!inner(subject_id)").eq("syllabus_units.subject_id", subjectId);
  const topicIds = (topics ?? []).map((t) => t.id);
  const { data: topicTranslations } = topicIds.length ? await supabase.from("syllabus_topic_translations").select("topic_id, language_code, title").in("topic_id", topicIds).eq("status", "published") : { data: [] as { topic_id: string; language_code: string; title: string | null }[] };
  const translationMap = new Map<string, { language_code: string; title: string | null }[]>();
  for (const row of topicTranslations ?? []) { const existing = translationMap.get(row.topic_id) ?? []; existing.push(row); translationMap.set(row.topic_id, existing); }
  const { data: yearsRaw } = await supabase.from("questions").select("year").eq("subject_id", subjectId).eq("review_status", "PUBLISHED").not("year", "is", null);
  const years = Array.from(new Set((yearsRaw ?? []).map((r) => r.year))).sort((a, b) => (b ?? 0) - (a ?? 0));
  let mastery: { topic_id: string; mastery: number; due_at: string }[] = [];
  if (profile && topicIds.length > 0) { const { data } = await supabase.from("topic_mastery").select("topic_id, mastery, due_at").eq("student_id", profile.id).in("topic_id", topicIds); mastery = data ?? []; }
  const avgMastery = mastery.length > 0 ? Math.round(mastery.reduce((a, m) => a + m.mastery, 0) / mastery.length) : null;
  let adaptiveIds: string[] | null = null;
  if (mode === "adaptive" && profile) {
    const { data: adaptiveQueue } = await supabase.rpc("get_adaptive_practice_questions", {
      p_student_id: profile.id,
      p_subject_id: subjectId,
      p_limit: 30,
    });
    adaptiveIds = (adaptiveQueue as { question_id: string }[] | null ?? []).map((row) => row.question_id);
  }
  let query = supabase.from("questions").select("*").eq("subject_id", subjectId).eq("review_status", "PUBLISHED");
  if (adaptiveIds) query = adaptiveIds.length > 0 ? query.in("id", adaptiveIds) : query.eq("id", "00000000-0000-0000-0000-000000000000");
  if (topic) query = query.eq("topic_id", topic);
  if (year) query = query.eq("year", Number(year));
  if (difficulty) query = query.eq("difficulty", difficulty);
  if (mode === "weak") { const weakTopics = mastery.filter((m) => m.mastery < 50).map((m) => m.topic_id); query = weakTopics.length > 0 ? query.in("topic_id", weakTopics) : query.eq("topic_id", "00000000-0000-0000-0000-000000000000"); }
  else if (mode === "revision") { const dueTopics = mastery.filter((m) => new Date(m.due_at) <= new Date()).map((m) => m.topic_id); query = dueTopics.length > 0 ? query.in("topic_id", dueTopics) : query.eq("topic_id", "00000000-0000-0000-0000-000000000000"); }
  const { data: questions } = await query;
  const questionIds = (questions ?? []).map((question) => question.id);
  const { data: questionTranslations } = questionIds.length ? await supabase.from("question_translations").select("question_id, language_code, question_text, options").in("question_id", questionIds).eq("status", "published") : { data: [] as { question_id: string; language_code: string; question_text: string | null; options: unknown }[] };
  const questionTranslationMap = new Map<string, { language_code: string; question_text: string | null; options: unknown }[]>();
  for (const row of questionTranslations ?? []) { const existing = questionTranslationMap.get(row.question_id) ?? []; existing.push(row); questionTranslationMap.set(row.question_id, existing); }
  const localizedQuestions = (questions ?? []).map((question) => localizedQuestion(question, questionTranslationMap.get(question.id), language));
  const activeMode = MODES.find((m) => m.key === mode)!;
  const buildHref = (m: Mode) => { const usp = new URLSearchParams(); if (m !== "all") usp.set("mode", m); if (topic) usp.set("topic", topic); if (year) usp.set("year", year); if (difficulty) usp.set("difficulty", difficulty); const qs = usp.toString(); return `/subjects/${subjectId}/practice${qs ? `?${qs}` : ""}`; };
  const filterTopics = (topics ?? []).map((t) => ({ id: t.id, title: localizedTitle(translationMap.get(t.id) ?? null, language, t.title) }));
  return <MaybeShell isLoggedIn={!!profile} isStaff={profile ? profile.role !== "student" : false} activeHref="/practice">
    <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">{subject.name} practice</h1><p className="text-ink-soft mb-6 text-sm">{activeMode.blurb}</p>
    {profile && <div className="flex flex-wrap gap-2 mb-6">{MODES.map((m) => <Link key={m.key} href={buildHref(m.key)} className={`text-xs px-3.5 py-2 rounded-full border transition-colors ${m.key === mode ? "bg-ink text-white border-ink" : "border-rule text-ink-soft hover:border-ink-faint"}`}>{m.label}</Link>)}</div>}
    {profile && avgMastery !== null && <div className="clay p-4 mb-6 flex items-center justify-between"><div><p className="section-label mb-1">Your mastery in {subject.name}</p><p className="text-xs text-ink-faint">Based on {mastery.length} tracked topic{mastery.length === 1 ? "" : "s"}</p></div><p className="text-[22px] font-bold tracking-[-0.03em]">{avgMastery}%</p></div>}
    <PracticeFilters subjectId={subjectId} topics={filterTopics} years={years.filter((y): y is number => y !== null)} current={{ topic, year, difficulty }} />
    <div className="mt-8"><PracticeClient key={`${mode}-${topic ?? ""}-${year ?? ""}-${difficulty ?? ""}`} questions={localizedQuestions} subjectId={subjectId} /></div>
  </MaybeShell>;
}

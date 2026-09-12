import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PracticeClient } from "./PracticeClient";
import { PracticeFilters } from "./PracticeFilters";

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ topic?: string; year?: string; difficulty?: string }>;
}) {
  const { subjectId } = await params;
  const { topic, year, difficulty } = await searchParams;
  const supabase = await createClient();

  const { data: subject } = await supabase.from("subjects").select("*").eq("id", subjectId).single();
  if (!subject) notFound();

  const { data: topics } = await supabase
    .from("syllabus_topics")
    .select("id, title, syllabus_units!inner(subject_id)")
    .eq("syllabus_units.subject_id", subjectId);

  const { data: yearsRaw } = await supabase
    .from("questions")
    .select("year")
    .eq("subject_id", subjectId)
    .not("year", "is", null);
  const years = Array.from(new Set((yearsRaw ?? []).map((r) => r.year))).sort(
    (a, b) => (b ?? 0) - (a ?? 0)
  );

  let query = supabase.from("questions").select("*").eq("subject_id", subjectId);
  if (topic) query = query.eq("topic_id", topic);
  if (year) query = query.eq("year", Number(year));
  if (difficulty) query = query.eq("difficulty", difficulty);

  const { data: questions } = await query;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="stat-serif text-4xl mb-1">{subject.name} practice</h1>
      <p className="text-ink-soft mb-8 text-sm">
        MCQ practice drawn from past papers and topic questions.
      </p>

      <PracticeFilters
        subjectId={subjectId}
        topics={(topics ?? []).map((t) => ({ id: t.id, title: t.title }))}
        years={years.filter((y): y is number => y !== null)}
        current={{ topic, year, difficulty }}
      />

      <div className="mt-8">
        <PracticeClient
          key={`${topic ?? ""}-${year ?? ""}-${difficulty ?? ""}`}
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
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { createQuestion, deleteQuestion } from "./actions";
import type { Subject } from "@/types/db";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject_id?: string }>;
}) {
  const { subject_id } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const { data: subjects } = await supabase.from("subjects").select("*").order("name");
  const subjectList = (subjects ?? []) as Subject[];
  const activeSubjectId = subject_id || subjectList[0]?.id;

  const { data: topics } = activeSubjectId
    ? await supabase
        .from("syllabus_topics")
        .select("id, title, syllabus_units!inner(subject_id)")
        .eq("syllabus_units.subject_id", activeSubjectId)
    : { data: [] };

  const { data: questions } = activeSubjectId
    ? await supabase
        .from("questions")
        .select("*, syllabus_topics(title)")
        .eq("subject_id", activeSubjectId)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <AppShell activeHref="/admin/questions" isStaff showInstitutes={profile.role !== "teacher"}>
      <div className="max-w-2xl px-6 md:px-8 py-10">
        <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Question bank</h1>
        <p className="text-ink-soft mb-8 text-sm">
          Create and manage MCQ questions used in practice and mock exams.
        </p>

        <form method="get" className="mb-8">
          <select
            name="subject_id"
            defaultValue={activeSubjectId}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="field"
          >
            {subjectList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </form>

        <details className="clay p-6 mb-10">
          <summary className="cursor-pointer text-sm font-medium">+ New question</summary>
          <form action={createQuestion} className="space-y-4 mt-5">
            <input type="hidden" name="subject_id" value={activeSubjectId} />
            <div>
              <label className="block text-sm mb-1.5">Question</label>
              <textarea
                name="question_text"
                required
                rows={2}
                className="field resize-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5">Topic (optional)</label>
              <select name="topic_id" className="field">
                <option value="">No specific topic</option>
                {(topics ?? []).map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm mb-1">Options (select the correct one)</label>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <input type="radio" name="correct_index" value={i} required={i === 0} />
                  <input
                    name={`option_${i}`}
                    placeholder={`Option ${i + 1}${i < 2 ? " (required)" : " (optional)"}`}
                    required={i < 2}
                    className="field flex-1"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <select name="difficulty" defaultValue="medium" className="field">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <input type="number" name="year" placeholder="Year (optional)" className="field" />
              <input type="number" name="marks" placeholder="Marks" defaultValue={1} className="field" />
            </div>
            <input name="source" placeholder="Source (e.g. 2023 A/L Physics Paper I) — optional" className="field" />
            <button type="submit" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">
              Add question
            </button>
          </form>
        </details>

        {(questions ?? []).length === 0 ? (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
            No questions for this subject yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {(questions ?? []).map((q) => (
              <li key={q.id} className="clay p-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm flex-1">{q.question_text}</p>
                  <form action={async () => { "use server"; await deleteQuestion(q.id); }}>
                    <button type="submit" className="text-xs text-ink-faint hover:text-red-500 shrink-0">
                      Delete
                    </button>
                  </form>
                </div>
                <p className="text-xs text-ink-faint mt-2">
                  {q.difficulty} · {q.marks} mark{q.marks === 1 ? "" : "s"}
                  {q.syllabus_topics?.title ? ` · ${q.syllabus_topics.title}` : ""}
                  {q.year ? ` · ${q.year}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

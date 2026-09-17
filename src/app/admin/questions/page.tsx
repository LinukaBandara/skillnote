import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { createQuestion, deleteQuestion, updateQuestionReviewStatus } from "./actions";
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

  const [{ data: versions }, { data: topics }, { data: competencies }, { data: subtopics }, { data: outcomes }, { data: questions }] = await Promise.all([
    supabase.from("syllabus_versions").select("id, code, name").order("created_at", { ascending: false }),
    activeSubjectId
      ? supabase.from("syllabus_topics").select("id, title, syllabus_units!inner(subject_id)").eq("syllabus_units.subject_id", activeSubjectId).order("title")
      : Promise.resolve({ data: [] as never[] }),
    activeSubjectId
      ? supabase.from("syllabus_competencies").select("id, code, title, syllabus_version_id, subject_id").eq("subject_id", activeSubjectId).order("position")
      : Promise.resolve({ data: [] as never[] }),
    activeSubjectId
      ? supabase.from("syllabus_subtopics").select("id, title, syllabus_topics!inner(syllabus_units!inner(subject_id))").eq("syllabus_topics.syllabus_units.subject_id", activeSubjectId).order("position")
      : Promise.resolve({ data: [] as never[] }),
    activeSubjectId
      ? supabase.from("syllabus_learning_outcomes").select("id, code, statement, subtopic_id").order("position")
      : Promise.resolve({ data: [] as never[] }),
    activeSubjectId
      ? supabase.from("questions").select("*, syllabus_topics(title)").eq("subject_id", activeSubjectId).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const competencyIds = (competencies ?? []).map((c) => c.id);
  const { data: competencyLevels } = competencyIds.length
    ? await supabase.from("syllabus_competency_levels").select("id, code, title, competency_id").in("competency_id", competencyIds).order("position")
    : { data: [] as never[] };

  const outcomeList = outcomes ?? [];
  const subtopicList = subtopics ?? [];
  const levelList = competencyLevels ?? [];

  return (
    <AppShell activeHref="/admin/questions" isStaff showInstitutes={profile.role !== "teacher"}>
      <div className="max-w-3xl px-6 md:px-8 py-10">
        <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Question bank</h1>
        <p className="text-ink-soft mb-8 text-sm">Author questions against the academic hierarchy, then move them through review before publishing.</p>

        <form method="get" className="mb-8">
          <select name="subject_id" defaultValue={activeSubjectId} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="field">
            {subjectList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </form>

        <details className="clay p-6 mb-10">
          <summary className="cursor-pointer text-sm font-medium">+ New question</summary>
          <form action={createQuestion} className="space-y-4 mt-5">
            <input type="hidden" name="subject_id" value={activeSubjectId ?? ""} />

            <div className="grid gap-4 md:grid-cols-2">
              <select name="question_type" defaultValue="mcq" className="field">
                <option value="mcq">Multiple choice</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short answer</option>
                <option value="structured">Structured</option>
                <option value="essay">Essay</option>
                <option value="numerical">Numerical</option>
                <option value="practical">Practical</option>
              </select>
              <select name="medium" defaultValue="english" className="field">
                <option value="english">English</option>
                <option value="sinhala">Sinhala</option>
                <option value="tamil">Tamil</option>
              </select>
            </div>

            <textarea name="question_text" required rows={3} placeholder="Question / prompt" className="field resize-none" />

            <div className="grid gap-4 md:grid-cols-2">
              <select name="syllabus_version_id" className="field">
                <option value="">Syllabus version (optional)</option>
                {(versions ?? []).map((v) => <option key={v.id} value={v.id}>{v.name} ({v.code})</option>)}
              </select>
              <select name="topic_id" className="field">
                <option value="">Topic (optional)</option>
                {(topics ?? []).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <select name="competency_id" className="field">
                <option value="">Competency (optional)</option>
                {(competencies ?? []).map((c) => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}
              </select>
              <select name="competency_level_id" className="field">
                <option value="">Competency level (optional)</option>
                {levelList.map((l) => <option key={l.id} value={l.id}>{l.code} · {l.title}</option>)}
              </select>
              <select name="subtopic_id" className="field">
                <option value="">Subtopic (optional)</option>
                {subtopicList.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
              <select name="learning_outcome_id" className="field">
                <option value="">Learning outcome (optional)</option>
                {outcomeList.map((o) => <option key={o.id} value={o.id}>{o.code ? `${o.code} · ` : ""}{o.statement}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm mb-1">MCQ options</label>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <input type="radio" name="correct_index" value={i} required={i === 0} />
                  <input name={`option_${i}`} placeholder={`Option ${i + 1}${i < 2 ? " (required for MCQ)" : ""}`} required={i < 2} className="field flex-1" />
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <select name="difficulty" defaultValue="medium" className="field"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
              <input type="number" min="1" name="marks" placeholder="Marks" defaultValue={1} className="field" />
              <input type="number" min="1" name="estimated_time_seconds" placeholder="Time (sec)" className="field" />
              <input type="number" name="year" placeholder="Year" className="field" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <input type="number" min="1" name="paper_number" placeholder="Paper number" className="field" />
              <input name="section" placeholder="Section" className="field" />
              <input name="tags" placeholder="Tags, comma separated" className="field" />
            </div>

            <textarea name="explanation" placeholder="Explanation / marking guidance (optional)" rows={3} className="field resize-none" />

            <div className="grid gap-4 md:grid-cols-2">
              <select name="source_type" defaultValue="teacher_authored" className="field">
                <option value="teacher_authored">Teacher authored</option>
                <option value="skill_note_authored">Skill Note authored</option>
                <option value="ai_assisted">AI assisted</option>
                <option value="licensed">Licensed</option>
                <option value="official">Official source</option>
              </select>
              <select name="licensing_status" defaultValue="unknown" className="field">
                <option value="unknown">Rights unknown</option>
                <option value="owned">Owned</option>
                <option value="licensed">Licensed</option>
                <option value="public_domain">Public domain</option>
                <option value="restricted">Restricted</option>
                <option value="not_for_distribution">Not for distribution</option>
              </select>
            </div>
            <input name="source" placeholder="Source label" className="field" />
            <input name="source_reference" placeholder="Source URL / document reference / provenance note" className="field" />

            <button type="submit" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">Save as draft</button>
          </form>
        </details>

        {(questions ?? []).length === 0 ? (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">No questions for this subject yet.</p>
        ) : (
          <ul className="space-y-3">
            {(questions ?? []).map((q) => (
              <li key={q.id} className="clay p-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm flex-1">{q.question_text}</p>
                  <form action={async () => { "use server"; await deleteQuestion(q.id); }}><button type="submit" className="text-xs text-ink-faint hover:text-red-500 shrink-0">Delete</button></form>
                </div>
                <p className="text-xs text-ink-faint mt-2">{q.question_type} · {q.difficulty} · {q.marks} mark{q.marks === 1 ? "" : "s"}{q.syllabus_topics?.title ? ` · ${q.syllabus_topics.title}` : ""}{q.year ? ` · ${q.year}` : ""}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs border border-rule rounded-full px-2.5 py-1">{q.review_status}</span>
                  <form action={updateQuestionReviewStatus} className="flex items-center gap-2">
                    <input type="hidden" name="question_id" value={q.id} />
                    <select name="review_status" defaultValue={q.review_status} className="field text-xs py-1.5">
                      <option value="draft">Draft</option><option value="review">Review</option><option value="approved">Approved</option><option value="published">Published</option><option value="archived">Archived</option>
                    </select>
                    <input name="note" placeholder="Review note" className="field text-xs py-1.5" />
                    <button type="submit" className="text-xs border border-rule rounded-full px-3 py-1.5">Update</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

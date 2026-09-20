import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { createExamSeries, createPaper, createPaperSection, addQuestionToPaper } from "./actions";

export default async function AdminExamsPage({ searchParams }: { searchParams: Promise<{ series?: string; paper?: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: subjects }, { data: syllabusVersions }, { data: seriesList }] = await Promise.all([
    supabase.from("subjects").select("id,name").order("name"),
    supabase.from("syllabus_versions").select("id,name,version_label").order("created_at", { ascending: false }),
    supabase.from("exam_series").select("id,title,subject_id,exam_year,series_name,review_status,subjects(name),papers(id,paper_number,medium,review_status)").order("created_at", { ascending: false }),
  ]);

  const selectedSeries = params.series ? (seriesList ?? []).find((s) => s.id === params.series) : undefined;
  const selectedPaperId = params.paper;
  const selectedPaper = selectedPaperId
    ? (selectedSeries?.papers ?? []).find((p) => p.id === selectedPaperId)
    : undefined;

  const [{ data: sections }, { data: questions }] = await Promise.all([
    selectedPaperId
      ? supabase.from("paper_sections").select("id,title,code,position,marks,paper_questions(id,question_id,question_number,position,marks,is_required,questions(question_text,question_type,difficulty))").eq("paper_id", selectedPaperId).order("position")
      : Promise.resolve({ data: [] as any[] }),
    selectedSeries
      ? supabase.from("questions").select("id,question_text,question_type,difficulty,marks,review_status").eq("subject_id", selectedSeries.subject_id).in("review_status", ["approved", "published"]).order("created_at", { ascending: false }).limit(100)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  return (
    <AppShell activeHref="/admin/exams" isStaff showInstitutes={profile.role !== "teacher"}>
      <div className="max-w-3xl px-6 md:px-8 py-10">
        <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Examination engine</h1>
        <p className="text-ink-soft mb-8 text-sm">Build verified exam series, papers, sections and question mappings. Official content is not seeded automatically.</p>

        <details className="clay p-6 mb-8">
          <summary className="cursor-pointer text-sm font-medium">+ New exam series</summary>
          <form action={createExamSeries} className="grid gap-4 md:grid-cols-2 mt-5">
            <input name="title" placeholder="Series title" required className="field md:col-span-2" />
            <select name="subject_id" required className="field">
              {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input name="exam_year" type="number" placeholder="Exam year" className="field" />
            <input name="series_name" placeholder="Series name (e.g. Main)" className="field" />
            <select name="syllabus_version_id" className="field">
              <option value="">No syllabus version</option>
              {(syllabusVersions ?? []).map((v) => <option key={v.id} value={v.id}>{v.name} {v.version_label ? `· ${v.version_label}` : ""}</option>)}
            </select>
            <select name="source_type" className="field"><option value="teacher_authored">Teacher authored</option><option value="skill_note_authored">Skill Note authored</option><option value="licensed">Licensed</option><option value="official">Official</option><option value="ai_assisted">AI assisted</option></select>
            <select name="licensing_status" className="field"><option value="unknown">Rights unknown</option><option value="owned">Owned</option><option value="licensed">Licensed</option><option value="public_domain">Public domain</option><option value="restricted">Restricted</option><option value="not_for_distribution">Not for distribution</option></select>
            <input name="source_reference" placeholder="Source / rights reference" className="field md:col-span-2" />
            <button className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium md:col-span-2">Create series</button>
          </form>
        </details>

        <div className="space-y-3 mb-10">
          {(seriesList ?? []).map((s) => (
            <a key={s.id} href={`/admin/exams?series=${s.id}`} className={`block border border-rule rounded-xl p-4 ${selectedSeries?.id === s.id ? "bg-surface" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-sm font-medium">{s.title}</p><p className="text-xs text-ink-soft mt-1">{s.subjects?.[0]?.name} · {s.exam_year ?? "Year not set"} · {s.papers?.length ?? 0} paper{(s.papers?.length ?? 0) === 1 ? "" : "s"}</p></div>
                <span className="text-xs text-ink-faint capitalize">{s.review_status}</span>
              </div>
            </a>
          ))}
        </div>

        {selectedSeries && (
          <section className="border-t border-rule pt-8">
            <div className="flex items-center justify-between mb-5">
              <div><h2 className="text-lg font-semibold">{selectedSeries.title}</h2><p className="text-sm text-ink-soft">Paper architecture</p></div>
            </div>

            <details className="clay p-5 mb-6">
              <summary className="cursor-pointer text-sm font-medium">+ New paper</summary>
              <form action={createPaper} className="grid gap-4 md:grid-cols-2 mt-5">
                <input type="hidden" name="exam_series_id" value={selectedSeries.id} />
                <input type="hidden" name="subject_id" value={selectedSeries.subject_id} />
                <input name="paper_number" type="number" min="1" placeholder="Paper number" required className="field" />
                <input name="medium" placeholder="Medium (english / sinhala / tamil)" defaultValue="english" className="field" />
                <input name="duration_minutes" type="number" min="1" placeholder="Duration (minutes)" className="field" />
                <input name="total_marks" type="number" min="1" placeholder="Total marks" className="field" />
                <input name="source" placeholder="Source" className="field" />
                <input name="source_reference" placeholder="Source reference / rights" className="field" />
                <select name="source_type" className="field"><option value="teacher_authored">Teacher authored</option><option value="skill_note_authored">Skill Note authored</option><option value="licensed">Licensed</option><option value="official">Official</option><option value="ai_assisted">AI assisted</option></select>
                <select name="licensing_status" className="field"><option value="unknown">Rights unknown</option><option value="owned">Owned</option><option value="licensed">Licensed</option><option value="public_domain">Public domain</option><option value="restricted">Restricted</option><option value="not_for_distribution">Not for distribution</option></select>
                <button className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium md:col-span-2">Create paper</button>
              </form>
            </details>

            <div className="space-y-2 mb-8">
              {(selectedSeries.papers ?? []).map((p) => <a key={p.id} href={`/admin/exams?series=${selectedSeries.id}&paper=${p.id}`} className={`flex justify-between border-b border-rule py-3 text-sm ${selectedPaperId === p.id ? "text-cobalt" : ""}`}><span>Paper {p.paper_number} · {p.medium}</span><span className="text-xs text-ink-faint capitalize">{p.review_status}</span></a>)}
            </div>
          </section>
        )}

        {selectedSeries && selectedPaperId && selectedPaper && (
          <section className="border-t border-rule pt-8">
            <h2 className="text-lg font-semibold mb-1">Paper {selectedPaper.paper_number}</h2>
            <p className="text-sm text-ink-soft mb-6">Sections and question mapping</p>

            <details className="clay p-5 mb-6">
              <summary className="cursor-pointer text-sm font-medium">+ New section</summary>
              <form action={createPaperSection} className="grid gap-4 md:grid-cols-2 mt-5">
                <input type="hidden" name="paper_id" value={selectedPaperId} />
                <input name="title" placeholder="Section title" required className="field" />
                <input name="code" placeholder="Code (optional)" className="field" />
                <input name="position" type="number" min="1" placeholder="Position" required className="field" />
                <input name="marks" type="number" min="1" placeholder="Section marks" className="field" />
                <input name="instructions" placeholder="Instructions" className="field md:col-span-2" />
                <button className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium md:col-span-2">Create section</button>
              </form>
            </details>

            {(sections ?? []).map((section) => (
              <div key={section.id} className="border border-rule rounded-xl p-5 mb-5">
                <div className="flex justify-between mb-4"><div><p className="text-sm font-medium">{section.code ? `${section.code} · ` : ""}{section.title}</p><p className="text-xs text-ink-soft mt-1">{section.marks ?? ""} marks</p></div><span className="text-xs text-ink-faint">Section {section.position}</span></div>
                <div className="space-y-2 mb-5">
                  {(section.paper_questions ?? []).map((pq: { id: string; question_number: string; marks: number | null; questions?: { question_text: string; question_type: string }[] | null }) => <div key={pq.id} className="text-sm border-t border-rule pt-2"><span className="font-medium">{pq.question_number}.</span> {pq.questions?.[0]?.question_text} <span className="text-xs text-ink-faint">· {pq.questions?.[0]?.question_type} · {pq.marks ?? ""} marks</span></div>)}
                </div>
                <form action={addQuestionToPaper} className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="section_id" value={section.id} />
                  <select name="question_id" required className="field md:col-span-2"><option value="">Select approved question</option>{(questions ?? []).map((q) => <option key={q.id} value={q.id}>{q.question_text.slice(0, 100)} · {q.question_type}</option>)}</select>
                  <input name="question_number" placeholder="Question number (e.g. 1a)" required className="field" />
                  <input name="position" type="number" min="1" placeholder="Position" required className="field" />
                  <input name="marks" type="number" min="1" placeholder="Marks" className="field" />
                  <input name="choice_group" placeholder="Choice group (optional)" className="field" />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_required" defaultChecked /> Required</label>
                  <button className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium md:col-span-2">Add question</button>
                </form>
              </div>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}

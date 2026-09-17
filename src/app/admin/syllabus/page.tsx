import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { createCompetency, createCompetencyLevel, createLearningOutcome, createSubtopic, createSyllabusVersion } from "./actions";

export default async function AdminSyllabusPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "platform_admin") redirect("/admin");

  const supabase = await createClient();
  const [{ data: versions }, { data: subjects }, { data: competencies }, { data: competencyLevels }, { data: topics }, { data: subtopics }] = await Promise.all([
    supabase.from("syllabus_versions").select("*").order("created_at", { ascending: false }),
    supabase.from("subjects").select("id, name").order("name"),
    supabase.from("syllabus_competencies").select("id, code, title, syllabus_version_id, subject_id, syllabus_versions(name), subjects(name)").order("position"),
    supabase.from("syllabus_competency_levels").select("id, code, title, position, competency_id, syllabus_competencies(code, title)").order("position"),
    supabase.from("syllabus_topics").select("id, title, syllabus_units(subject_id, subjects(name))").order("title"),
    supabase.from("syllabus_subtopics").select("id, title, topic_id, syllabus_topics(title)").order("title"),
  ]);

  return (
    <AppShell activeHref="/admin" isStaff showInstitutes>
      <div className="max-w-4xl px-6 md:px-8 py-10 space-y-10">
        <div><h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Syllabus</h1><p className="text-ink-soft text-sm">Manage the academic foundation used by Skill Note. This area is separate from the student experience.</p></div>

        <section>
          <h2 className="text-base font-medium mb-4">Syllabus versions</h2>
          <form action={createSyllabusVersion} className="border border-rule rounded-xl p-5 grid gap-4 md:grid-cols-2">
            <input name="code" required placeholder="Version code (e.g. AL_2026)" className="field" /><input name="name" required placeholder="Version name" className="field" />
            <input name="academic_year_from" type="number" placeholder="Academic year from" className="field" /><input name="academic_year_to" type="number" placeholder="Academic year to" className="field" />
            <textarea name="notes" placeholder="Source / verification notes" className="field md:col-span-2" rows={3} /><button className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium md:col-span-2">Create version</button>
          </form>
          <div className="mt-5 border-t border-rule">{(versions ?? []).map((v) => <div key={v.id} className="py-4 border-b border-rule flex items-center justify-between"><div><p className="font-medium text-sm">{v.name}</p><p className="text-xs text-ink-soft mt-1">{v.code} · {v.academic_year_from ?? ""}{v.academic_year_to ? `–${v.academic_year_to}` : ""}</p></div><span className="text-xs text-ink-faint">{v.is_active ? "Active" : "Draft"}</span></div>)}{(versions ?? []).length === 0 && <p className="py-4 text-sm text-ink-soft">No syllabus versions yet.</p>}</div>
        </section>

        <section>
          <h2 className="text-base font-medium mb-2">Competencies</h2><p className="text-sm text-ink-soft mb-4">Attach verified competencies to a specific syllabus version and subject.</p>
          <form action={createCompetency} className="border border-rule rounded-xl p-5 grid gap-4 md:grid-cols-2">
            <select name="syllabus_version_id" required className="field"><option value="">Select syllabus version</option>{(versions ?? []).map((v) => <option key={v.id} value={v.id}>{v.name} ({v.code})</option>)}</select>
            <select name="subject_id" required className="field"><option value="">Select subject</option>{(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <input name="code" required placeholder="Competency code" className="field" /><input name="title" required placeholder="Competency title" className="field" />
            <textarea name="description" placeholder="Description (optional)" className="field md:col-span-2" rows={2} /><input name="position" type="number" min="1" defaultValue="1" className="field" /><button className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">Add competency</button>
          </form>
          <div className="mt-5 border-t border-rule">{(competencies ?? []).map((c) => { const v = Array.isArray(c.syllabus_versions) ? c.syllabus_versions[0] : c.syllabus_versions; const s = Array.isArray(c.subjects) ? c.subjects[0] : c.subjects; return <div key={c.id} className="py-3 border-b border-rule"><p className="text-sm font-medium">{c.code} · {c.title}</p><p className="text-xs text-ink-soft mt-1">{v?.name ?? "Version"} · {s?.name ?? "Subject"}</p></div>; })}</div>
        </section>

        <section>
          <h2 className="text-base font-medium mb-2">Competency levels</h2><p className="text-sm text-ink-soft mb-4">Levels inherit their syllabus version and subject from the selected competency.</p>
          <form action={createCompetencyLevel} className="border border-rule rounded-xl p-5 grid gap-4 md:grid-cols-2">
            <select name="competency_id" required className="field md:col-span-2"><option value="">Select competency</option>{(competencies ?? []).map((c) => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}</select>
            <input name="code" required placeholder="Level code" className="field" /><input name="title" required placeholder="Level title" className="field" />
            <textarea name="description" placeholder="Description (optional)" className="field md:col-span-2" rows={2} /><input name="position" type="number" min="1" defaultValue="1" className="field" /><button className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">Add competency level</button>
          </form>
          <div className="mt-5 border-t border-rule">{(competencyLevels ?? []).map((level) => { const competency = Array.isArray(level.syllabus_competencies) ? level.syllabus_competencies[0] : level.syllabus_competencies; return <div key={level.id} className="py-3 border-b border-rule"><p className="text-sm font-medium">{level.code} · {level.title}</p><p className="text-xs text-ink-soft mt-1">{competency?.code ?? "Competency"} · {competency?.title ?? ""}</p></div>; })}{(competencyLevels ?? []).length === 0 && <p className="py-4 text-sm text-ink-soft">No competency levels yet.</p>}</div>
        </section>

        <section>
          <h2 className="text-base font-medium mb-2">Subtopics</h2><p className="text-sm text-ink-soft mb-4">Add finer academic structure under an existing syllabus topic.</p>
          <form action={createSubtopic} className="border border-rule rounded-xl p-5 grid gap-4">
            <select name="topic_id" required className="field"><option value="">Select topic</option>{(topics ?? []).map((t) => { const u = Array.isArray(t.syllabus_units) ? t.syllabus_units[0] : t.syllabus_units; const s = u && (Array.isArray(u.subjects) ? u.subjects[0] : u.subjects); return <option key={t.id} value={t.id}>{s?.name ? `${s.name} — ` : ""}{t.title}</option>; })}</select>
            <input name="title" required placeholder="Subtopic title" className="field" /><textarea name="description" placeholder="Description (optional)" className="field" rows={2} /><input name="position" type="number" min="1" defaultValue="1" className="field" /><button className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">Add subtopic</button>
          </form>
        </section>

        <section>
          <h2 className="text-base font-medium mb-2">Learning outcomes</h2><p className="text-sm text-ink-soft mb-4">Define measurable learning targets beneath a subtopic. These will later drive lesson alignment and mastery.</p>
          <form action={createLearningOutcome} className="border border-rule rounded-xl p-5 grid gap-4">
            <select name="subtopic_id" required className="field"><option value="">Select subtopic</option>{(subtopics ?? []).map((s) => { const t = Array.isArray(s.syllabus_topics) ? s.syllabus_topics[0] : s.syllabus_topics; return <option key={s.id} value={s.id}>{t?.title ? `${t.title} — ` : ""}{s.title}</option>; })}</select>
            <input name="code" placeholder="Outcome code (optional)" className="field" /><textarea name="statement" required placeholder="Learning outcome statement" className="field" rows={3} /><input name="position" type="number" min="1" defaultValue="1" className="field" /><button className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">Add learning outcome</button>
          </form>
        </section>

        <p className="text-xs text-ink-faint border-l-2 border-rule pl-4">Only verified curriculum information should be entered here. Do not label a syllabus version as official until its source has been verified.</p>
      </div>
    </AppShell>
  );
}

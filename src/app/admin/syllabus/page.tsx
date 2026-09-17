import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { createLearningOutcome, createSubtopic, createSyllabusVersion } from "./actions";

export default async function AdminSyllabusPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "platform_admin") redirect("/admin");

  const supabase = await createClient();
  const [{ data: versions }, { data: streams }, { data: topics }, { data: subtopics }] = await Promise.all([
    supabase.from("syllabus_versions").select("*").order("created_at", { ascending: false }),
    supabase.from("streams").select("id, name").order("name"),
    supabase.from("syllabus_topics").select("id, title, syllabus_units(subject_id, subjects(name))").order("title"),
    supabase.from("syllabus_subtopics").select("id, title, topic_id, syllabus_topics(title)").order("title"),
  ]);

  const streamIds = new Set((streams ?? []).map((stream) => stream.id));

  return (
    <AppShell activeHref="/admin" isStaff showInstitutes>
      <div className="max-w-4xl px-6 md:px-8 py-10 space-y-10">
        <div>
          <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Syllabus</h1>
          <p className="text-ink-soft text-sm">Manage the academic foundation used by Skill Note. This area is intentionally separate from the student experience.</p>
        </div>

        <section>
          <h2 className="text-base font-medium mb-4">Syllabus versions</h2>
          <form action={createSyllabusVersion} className="border border-rule rounded-xl p-5 grid gap-4 md:grid-cols-2">
            <input name="code" required placeholder="Version code (e.g. AL_2026)" className="field" />
            <input name="name" required placeholder="Version name" className="field" />
            <input name="academic_year_from" type="number" placeholder="Academic year from" className="field" />
            <input name="academic_year_to" type="number" placeholder="Academic year to" className="field" />
            <textarea name="notes" placeholder="Source / verification notes" className="field md:col-span-2" rows={3} />
            <button className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium md:col-span-2">Create version</button>
          </form>

          <div className="mt-5 border-t border-rule">
            {(versions ?? []).map((version) => (
              <div key={version.id} className="py-4 border-b border-rule flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{version.name}</p>
                  <p className="text-xs text-ink-soft mt-1">{version.code} · {version.academic_year_from ?? ""}{version.academic_year_to ? `–${version.academic_year_to}` : ""}</p>
                </div>
                <span className="text-xs text-ink-faint">{version.is_active ? "Active" : "Draft"}</span>
              </div>
            ))}
            {(versions ?? []).length === 0 && <p className="py-4 text-sm text-ink-soft">No syllabus versions yet.</p>}
          </div>
        </section>

        <section>
          <h2 className="text-base font-medium mb-2">Subtopics</h2>
          <p className="text-sm text-ink-soft mb-4">Add finer academic structure under an existing syllabus topic.</p>
          <form action={createSubtopic} className="border border-rule rounded-xl p-5 grid gap-4">
            <select name="topic_id" required className="field">
              <option value="">Select topic</option>
              {(topics ?? []).map((topic) => {
                const unit = Array.isArray(topic.syllabus_units) ? topic.syllabus_units[0] : topic.syllabus_units;
                const subject = unit && (Array.isArray(unit.subjects) ? unit.subjects[0] : unit.subjects);
                return <option key={topic.id} value={topic.id}>{subject?.name ? `${subject.name} — ` : ""}{topic.title}</option>;
              })}
            </select>
            <input name="title" required placeholder="Subtopic title" className="field" />
            <textarea name="description" placeholder="Description (optional)" className="field" rows={2} />
            <input name="position" type="number" min="1" defaultValue="1" placeholder="Position" className="field" />
            <button className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">Add subtopic</button>
          </form>
        </section>

        <section>
          <h2 className="text-base font-medium mb-2">Learning outcomes</h2>
          <p className="text-sm text-ink-soft mb-4">Define measurable learning targets beneath a subtopic. These will later drive lesson alignment and mastery.</p>
          <form action={createLearningOutcome} className="border border-rule rounded-xl p-5 grid gap-4">
            <select name="subtopic_id" required className="field">
              <option value="">Select subtopic</option>
              {(subtopics ?? []).map((subtopic) => {
                const topic = Array.isArray(subtopic.syllabus_topics) ? subtopic.syllabus_topics[0] : subtopic.syllabus_topics;
                return <option key={subtopic.id} value={subtopic.id}>{topic?.title ? `${topic.title} — ` : ""}{subtopic.title}</option>;
              })}
            </select>
            <input name="code" placeholder="Outcome code (optional)" className="field" />
            <textarea name="statement" required placeholder="Learning outcome statement" className="field" rows={3} />
            <input name="position" type="number" min="1" defaultValue="1" placeholder="Position" className="field" />
            <button className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">Add learning outcome</button>
          </form>
        </section>

        <p className="text-xs text-ink-faint border-l-2 border-rule pl-4">Only verified curriculum information should be entered here. Do not label a syllabus version as official until its source has been verified.</p>
      </div>
    </AppShell>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";
import { createMockExam } from "./actions";
import type { Subject } from "@/types/db";

export default async function AdminMockExamsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const { data: subjects } = await supabase.from("subjects").select("*").order("name");
  const subjectList = (subjects ?? []) as Subject[];

  const { data: exams } = await supabase
    .from("mock_exams")
    .select("*, subjects(name), mock_exam_questions(count)")
    .order("created_at", { ascending: false });

  return (
    <AppShell activeHref="/admin/mock-exams" isStaff showInstitutes={profile.role !== "teacher"}>
      <div className="max-w-xl px-6 md:px-8 py-10">
        <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Mock exams</h1>
        <p className="text-ink-soft mb-8 text-sm">Create timed papers from the question bank.</p>

        <details className="clay p-6 mb-10">
          <summary className="cursor-pointer text-sm font-medium">+ New mock exam</summary>
          <form action={createMockExam} className="space-y-4 mt-5">
            <select name="subject_id" required className="field">
              {subjectList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              name="title"
              placeholder="Exam title (e.g. 2026 Model Paper)"
              required
              className="field"
            />
            <input
              type="number"
              name="duration_minutes"
              placeholder="Duration (minutes)"
              defaultValue={60}
              className="field"
            />
            <button type="submit" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">
              Create exam
            </button>
          </form>
        </details>

        {(exams ?? []).length === 0 ? (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">No mock exams yet.</p>
        ) : (
          <ul className="border-t border-rule">
            {(exams ?? []).map((e) => (
              <li key={e.id} className="border-b border-rule">
                <Link href={`/admin/mock-exams/${e.id}`} className="flex items-center justify-between py-4 group">
                  <div>
                    <p className="text-sm font-medium group-hover:text-cobalt transition-colors">{e.title}</p>
                    <p className="text-xs text-ink-faint mt-1">
                      {e.subjects?.name} · {e.mock_exam_questions?.[0]?.count ?? 0} question{(e.mock_exam_questions?.[0]?.count ?? 0) === 1 ? "" : "s"} · {e.duration_minutes} min
                    </p>
                  </div>
                  <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">Edit →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

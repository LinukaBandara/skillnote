import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";

export default async function PracticeIndexPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: studentSubjects } = await supabase
    .from("student_subjects")
    .select("subject_id, subjects(id, name)")
    .eq("student_id", profile.id);

  const subjects = (studentSubjects ?? [])
    .map((row) => row.subjects)
    .flat() as { id: string; name: string }[];

  return (
    <AppShell activeHref="/practice">
      <div className="max-w-xl px-6 md:px-8 py-10">
        <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Practice</h1>
        <p className="text-ink-soft mb-10 text-sm">
          MCQ practice and past papers, organized by subject.
        </p>

        {subjects.length === 0 ? (
          <div className="border border-dashed border-rule rounded-2xl p-8 text-center">
            <p className="text-ink-soft text-sm mb-4">Choose your subjects to start practicing.</p>
            <Link href="/onboarding" className="btn-primary inline-block px-5 py-2.5 rounded-full text-sm font-medium">
              Choose subjects
            </Link>
          </div>
        ) : (
          <ul className="border-t border-rule">
            {subjects.map((s) => (
              <li key={s.id} className="border-b border-rule">
                <Link
                  href={`/subjects/${s.id}/practice`}
                  className="flex items-center justify-between py-5 group"
                >
                  <span className="text-base font-medium group-hover:text-cobalt transition-colors">
                    {s.name}
                  </span>
                  <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">
                    Start practice →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

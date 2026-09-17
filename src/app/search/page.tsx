import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { MaybeShell } from "@/components/dashboard/MaybeShell";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const query = (q ?? "").trim();

  const [subjectsRes, coursesRes, topicsRes] = await Promise.all([
    query
      ? supabase.from("subjects").select("id, name").ilike("name", `%${query}%`).limit(10)
      : Promise.resolve({ data: [] }),
    query
      ? supabase
          .from("courses")
          .select("id, title, description")
          .eq("published", true)
          .ilike("title", `%${query}%`)
          .limit(10)
      : Promise.resolve({ data: [] }),
    query
      ? supabase
          .from("syllabus_topics")
          .select("id, title, syllabus_units(subject_id, subjects(id, name))")
          .ilike("title", `%${query}%`)
          .limit(10)
      : Promise.resolve({ data: [] }),
  ]);

  const subjects = subjectsRes.data ?? [];
  const courses = coursesRes.data ?? [];
  const topics = (topicsRes.data ?? []) as unknown as {
    id: string;
    title: string;
    syllabus_units: { subject_id: string; subjects: { id: string; name: string } | { id: string; name: string }[] } | null;
  }[];

  const totalResults = subjects.length + courses.length + topics.length;

  return (
    <MaybeShell isLoggedIn={!!profile} isStaff={profile ? profile.role !== "student" : false} activeHref="/dashboard">
      <h1 className="text-[25px] font-semibold tracking-[-0.025em] mb-1">Search</h1>
      <p className="text-ink-soft mb-10 text-sm">
        {query ? `${totalResults} result${totalResults === 1 ? "" : "s"} for "${query}"` : "Search subjects, courses, and topics."}
      </p>

      <form method="get" className="mb-10">
        <div className="flex items-center gap-2 bg-bg-warm rounded-full px-4 py-2.5 max-w-md">
          <svg className="w-4 h-4 text-ink-faint shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search subjects, courses, topics..."
            className="bg-transparent text-sm w-full focus:outline-none placeholder:text-ink-faint"
          />
        </div>
      </form>

      {query && totalResults === 0 && (
        <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
          No results for &ldquo;{query}&rdquo;.
        </p>
      )}

      {subjects.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs text-ink-faint uppercase tracking-wide mb-3">Subjects</h2>
          <ul className="border-t border-rule">
            {subjects.map((s) => (
              <li key={s.id} className="border-b border-rule">
                <Link href={`/subjects/${s.id}`} className="flex items-center justify-between py-3 group">
                  <span className="text-sm group-hover:text-cobalt transition-colors">{s.name}</span>
                  <span className="text-xs text-ink-faint">Subject</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {courses.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs text-ink-faint uppercase tracking-wide mb-3">Courses</h2>
          <ul className="border-t border-rule">
            {courses.map((c) => (
              <li key={c.id} className="border-b border-rule">
                <Link href={`/courses/${c.id}`} className="flex items-center justify-between py-3 group">
                  <div>
                    <span className="text-sm group-hover:text-cobalt transition-colors">{c.title}</span>
                    {c.description && <p className="text-xs text-ink-faint mt-0.5 line-clamp-1">{c.description}</p>}
                  </div>
                  <span className="text-xs text-ink-faint shrink-0">Course</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {topics.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs text-ink-faint uppercase tracking-wide mb-3">Topics</h2>
          <ul className="border-t border-rule">
            {topics.map((t) => {
              const subj = Array.isArray(t.syllabus_units?.subjects)
                ? t.syllabus_units?.subjects[0]
                : t.syllabus_units?.subjects;
              return (
                <li key={t.id} className="border-b border-rule">
                  <Link href={subj ? `/subjects/${subj.id}` : "/subjects"} className="flex items-center justify-between py-3 group">
                    <span className="text-sm group-hover:text-cobalt transition-colors">{t.title}</span>
                    <span className="text-xs text-ink-faint">{subj?.name ?? "Topic"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </MaybeShell>
  );
}

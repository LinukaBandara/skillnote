import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Stream, Subject } from "@/types/db";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: streams } = await supabase.from("streams").select("*").order("name");
  const { data: subjects } = await supabase.from("subjects").select("*").order("name");

  const streamList = (streams ?? []) as Stream[];
  const subjectList = (subjects ?? []) as Subject[];

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="stat-serif text-4xl mb-1">Subjects</h1>
      <p className="text-ink-soft mb-12 text-sm">
        Browse the A/L syllabus by stream.
      </p>

      <div className="space-y-10">
        {streamList.map((stream) => {
          const streamSubjects = subjectList.filter((s) => s.stream_id === stream.id);
          if (streamSubjects.length === 0) return null;
          return (
            <div key={stream.id}>
              <h2 className="text-xs text-ink-faint mb-3">{stream.name}</h2>
              <ul className="border-t border-rule">
                {streamSubjects.map((subject) => (
                  <li key={subject.id} className="border-b border-rule">
                    <Link
                      href={`/subjects/${subject.id}`}
                      className="flex items-center justify-between py-4 group"
                    >
                      <span className="text-base font-medium group-hover:text-cobalt transition-colors">
                        {subject.name}
                      </span>
                      <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">
                        View syllabus
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

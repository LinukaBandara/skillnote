import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/types/db";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const list = (courses ?? []) as Course[];

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="stat-serif text-4xl mb-1">Subjects</h1>
      <p className="text-ink-soft mb-12 text-sm">{list.length} available right now.</p>

      {list.length === 0 ? (
        <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
          No subjects are published yet. Check back soon.
        </p>
      ) : (
        <ul className="border-t border-rule">
          {list.map((course) => (
            <li key={course.id} className="border-b border-rule">
              <Link
                href={`/courses/${course.id}`}
                className="flex items-baseline justify-between gap-6 py-6 group"
              >
                <div>
                  <h2 className="text-base font-medium group-hover:text-cobalt transition-colors">
                    {course.title}
                  </h2>
                  {course.description && (
                    <p className="text-sm text-ink-soft mt-1 line-clamp-1">
                      {course.description}
                    </p>
                  )}
                </div>
                <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors shrink-0">
                  View
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

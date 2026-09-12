import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createCourse } from "../actions";
import type { Course, Subject } from "@/types/db";

export default async function AdminCoursesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();

  const coursesQuery = supabase.from("courses").select("*").order("created_at", { ascending: false });
  if (profile.role !== "platform_admin") {
    coursesQuery.eq("institute_id", profile.institute_id ?? "");
  }
  const { data: courses } = await coursesQuery;

  const { data: subjects } = await supabase.from("subjects").select("*").order("name");

  const courseList = (courses ?? []) as Course[];
  const subjectList = (subjects ?? []) as Subject[];

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="stat-serif text-4xl mb-1">Courses</h1>
      <p className="text-ink-soft mb-10 text-sm">Create and manage course content.</p>

      <details className="clay p-6 mb-10">
        <summary className="cursor-pointer text-sm font-medium">+ New course</summary>
        <form action={createCourse} className="space-y-4 mt-5">
          <div>
            <label className="block text-sm mb-1.5">Title</label>
            <input
              name="title"
              required
              className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-cobalt"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Description</label>
            <textarea
              name="description"
              rows={2}
              className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-cobalt resize-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Subject (optional)</label>
            <select name="subject_id" className="w-full border-b border-rule bg-transparent py-2 focus:outline-none focus:border-cobalt">
              <option value="">No subject</option>
              {subjectList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">
            Create course
          </button>
        </form>
      </details>

      {courseList.length === 0 ? (
        <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
          No courses yet.
        </p>
      ) : (
        <ul className="border-t border-rule">
          {courseList.map((course) => (
            <li key={course.id} className="border-b border-rule">
              <Link href={`/admin/courses/${course.id}`} className="flex items-center justify-between py-5 group">
                <div>
                  <h2 className="text-base font-medium group-hover:text-cobalt transition-colors">{course.title}</h2>
                  <p className="text-xs text-ink-faint mt-1">{course.published ? "Published" : "Draft"}</p>
                </div>
                <span className="text-sm text-ink-faint group-hover:text-cobalt transition-colors">Edit</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

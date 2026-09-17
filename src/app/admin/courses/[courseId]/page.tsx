import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { addModule, addLesson, togglePublish } from "../../actions";
import { AppShell } from "@/components/dashboard/AppShell";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("*, lessons(*)")
    .eq("course_id", courseId)
    .order("position");

  return (
    <AppShell activeHref="/admin/courses" isStaff showInstitutes={profile.role !== "teacher"}>
    <div className="max-w-xl px-6 md:px-8 py-10">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-semibold">{course.title}</h1>
        <form action={async () => { "use server"; await togglePublish(courseId, !course.published); }}>
          <button
            type="submit"
            className={`text-sm px-4 py-2 rounded-full border ${course.published ? "border-sage text-sage" : "border-rule text-ink-soft"}`}
          >
            {course.published ? "Published" : "Publish"}
          </button>
        </form>
      </div>
      {course.description && <p className="text-ink-soft text-sm mb-6">{course.description}</p>}
      <Link
        href={`/admin/courses/${courseId}/assignments`}
        className="text-sm text-cobalt border-b border-cobalt/30 hover:border-cobalt pb-0.5 inline-block mb-10"
      >
        Manage assignments →
      </Link>

      <div className="space-y-10">
        {(modules ?? []).map((mod) => (
          <div key={mod.id}>
            <h2 className="section-label mb-3">{mod.title}</h2>
            <ul className="border-t border-rule mb-4">
              {(mod.lessons ?? [])
                .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
                .map((lesson: { id: string; title: string }) => (
                  <li key={lesson.id} className="border-b border-rule py-3 text-sm">
                    {lesson.title}
                  </li>
                ))}
            </ul>
            <details>
              <summary className="cursor-pointer text-xs text-ink-soft">+ Add lesson</summary>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await addLesson(mod.id, courseId, formData);
                }}
                className="space-y-3 mt-3"
              >
                <input
                  name="title"
                  placeholder="Lesson title"
                  required
                  className="field"
                />
                <textarea
                  name="content"
                  placeholder="Lesson content"
                  rows={3}
                  className="field resize-none"
                />
                <input
                  name="video_url"
                  placeholder="Video URL (optional)"
                  className="field"
                />
                <button type="submit" className="text-xs btn-primary px-4 py-2 rounded-full">
                  Add lesson
                </button>
              </form>
            </details>
          </div>
        ))}
      </div>

      <details className="mt-10">
        <summary className="cursor-pointer text-sm font-medium">+ Add module</summary>
        <form
          action={async (formData: FormData) => {
            "use server";
            await addModule(courseId, formData);
          }}
          className="flex gap-3 mt-4"
        >
          <input
            name="title"
            placeholder="Module title"
            required
            className="field flex-1"
          />
          <button type="submit" className="btn-primary px-4 py-2 rounded-full text-sm">
            Add
          </button>
        </form>
      </details>
    </div>
    </AppShell>
  );
}

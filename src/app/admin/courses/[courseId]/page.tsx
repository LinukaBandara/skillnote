import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { addModule, addLesson, togglePublish } from "../../actions";

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
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="flex items-start justify-between mb-1">
        <h1 className="stat-serif text-4xl">{course.title}</h1>
        <form action={async () => { "use server"; await togglePublish(courseId, !course.published); }}>
          <button
            type="submit"
            className={`text-sm px-4 py-2 rounded-full border ${course.published ? "border-sage text-sage" : "border-rule text-ink-soft"}`}
          >
            {course.published ? "Published" : "Publish"}
          </button>
        </form>
      </div>
      {course.description && <p className="text-ink-soft text-sm mb-10">{course.description}</p>}

      <div className="space-y-10">
        {(modules ?? []).map((mod) => (
          <div key={mod.id}>
            <h2 className="text-sm font-medium text-ink-soft mb-3">{mod.title}</h2>
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
                  className="w-full border-b border-rule bg-transparent py-2 text-sm focus:outline-none focus:border-cobalt"
                />
                <textarea
                  name="content"
                  placeholder="Lesson content"
                  rows={3}
                  className="w-full border-b border-rule bg-transparent py-2 text-sm focus:outline-none focus:border-cobalt resize-none"
                />
                <input
                  name="video_url"
                  placeholder="Video URL (optional)"
                  className="w-full border-b border-rule bg-transparent py-2 text-sm focus:outline-none focus:border-cobalt"
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
            className="flex-1 border-b border-rule bg-transparent py-2 text-sm focus:outline-none focus:border-cobalt"
          />
          <button type="submit" className="btn-primary px-4 py-2 rounded-full text-sm">
            Add
          </button>
        </form>
      </details>
    </div>
  );
}

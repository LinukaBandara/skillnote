import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { notFound } from "next/navigation";
import Link from "next/link";
import { markLessonComplete } from "../../../actions";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: lesson } = await supabase.from("lessons").select("*").eq("id", lessonId).single();
  if (!lesson) notFound();

  // Build a flat ordered lesson list across the course for prev/next
  const { data: modules } = await supabase
    .from("modules")
    .select("id, position, lessons(id, title, position)")
    .eq("course_id", courseId)
    .order("position");

  const flatLessons = (modules ?? [])
    .sort((a, b) => a.position - b.position)
    .flatMap((m) => (m.lessons ?? []).sort((a: { position: number }, b: { position: number }) => a.position - b.position));

  const currentIdx = flatLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? flatLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx >= 0 && currentIdx < flatLessons.length - 1 ? flatLessons[currentIdx + 1] : null;

  let isComplete = false;
  if (profile) {
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("completed")
      .eq("student_id", profile.id)
      .eq("lesson_id", lessonId)
      .maybeSingle();
    isComplete = progress?.completed ?? false;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href={`/courses/${courseId}`} className="text-sm text-ink-soft hover:text-ink">
        ← Back to course
      </Link>

      <h1 className="stat-serif text-4xl mt-6 mb-6">{lesson.title}</h1>

      {lesson.video_url && (
        <div className="mb-6 aspect-video bg-ink/5 rounded-2xl flex items-center justify-center text-sm text-ink-soft">
          <a href={lesson.video_url} target="_blank" rel="noreferrer" className="underline">
            Watch video
          </a>
        </div>
      )}

      {lesson.content && (
        <div className="prose prose-sm max-w-none text-ink whitespace-pre-wrap mb-10">
          {lesson.content}
        </div>
      )}

      {profile && (
        <form action={async () => { "use server"; await markLessonComplete(lessonId, courseId); }} className="mb-10">
          <button
            type="submit"
            disabled={isComplete}
            className={`px-5 py-2.5 rounded-full text-sm font-medium ${isComplete ? "border border-sage text-sage" : "btn-primary"}`}
          >
            {isComplete ? "Completed" : "Mark as complete"}
          </button>
        </form>
      )}

      <div className="flex items-center justify-between border-t border-rule pt-6 text-sm">
        {prevLesson ? (
          <Link href={`/courses/${courseId}/lessons/${prevLesson.id}`} className="text-ink-soft hover:text-ink">
            ← {prevLesson.title}
          </Link>
        ) : <span />}
        {nextLesson && (
          <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`} className="text-ink-soft hover:text-ink">
            {nextLesson.title} →
          </Link>
        )}
      </div>
    </div>
  );
}

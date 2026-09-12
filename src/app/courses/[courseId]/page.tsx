import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { notFound } from "next/navigation";
import Link from "next/link";
import { enrollInCourse } from "../actions";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("*, lessons(*), quizzes(*)")
    .eq("course_id", courseId)
    .order("position");

  let enrolled = false;
  let completedLessonIds = new Set<string>();
  let hasCertificate = false;

  if (profile) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", profile.id)
      .eq("course_id", courseId)
      .maybeSingle();
    enrolled = !!enrollment;

    const allLessonIds = (modules ?? []).flatMap((m) => (m.lessons ?? []).map((l: { id: string }) => l.id));
    if (allLessonIds.length > 0) {
      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("student_id", profile.id)
        .eq("completed", true)
        .in("lesson_id", allLessonIds);
      completedLessonIds = new Set((progress ?? []).map((p) => p.lesson_id));
    }

    const { data: cert } = await supabase
      .from("certificates")
      .select("id")
      .eq("student_id", profile.id)
      .eq("course_id", courseId)
      .maybeSingle();
    hasCertificate = !!cert;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="stat-serif text-4xl mb-1">{course.title}</h1>
      {course.description && <p className="text-ink-soft mb-6 text-sm">{course.description}</p>}

      <div className="flex items-center gap-4 mb-10 text-sm">
        {!enrolled && profile && (
          <form action={async () => { "use server"; await enrollInCourse(courseId); }}>
            <button type="submit" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium">
              Enroll
            </button>
          </form>
        )}
        {!profile && (
          <Link href="/login" className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium inline-block">
            Sign in to enroll
          </Link>
        )}
        <Link href={`/courses/${courseId}/discussions`} className="text-ink-soft hover:text-ink border-b border-rule hover:border-ink pb-0.5">
          Discussions
        </Link>
        {hasCertificate && (
          <Link href={`/courses/${courseId}/certificate`} className="text-sage border-b border-sage/30 hover:border-sage pb-0.5">
            View certificate
          </Link>
        )}
      </div>

      <div className="space-y-10">
        {(modules ?? []).map((mod) => (
          <div key={mod.id}>
            <h2 className="text-sm font-medium text-ink-soft mb-3">{mod.title}</h2>
            <ul className="border-t border-rule">
              {(mod.lessons ?? [])
                .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
                .map((lesson: { id: string; title: string }) => (
                  <li key={lesson.id} className="border-b border-rule">
                    <Link
                      href={`/courses/${courseId}/lessons/${lesson.id}`}
                      className="flex items-center justify-between py-3 text-sm group"
                    >
                      <span className="group-hover:text-cobalt transition-colors">{lesson.title}</span>
                      {completedLessonIds.has(lesson.id) && (
                        <span className="text-xs text-sage">Completed</span>
                      )}
                    </Link>
                  </li>
                ))}
              {(mod.quizzes ?? []).map((quiz: { id: string; title: string }) => (
                <li key={quiz.id} className="border-b border-rule">
                  <Link
                    href={`/courses/${courseId}/quizzes/${quiz.id}`}
                    className="flex items-center justify-between py-3 text-sm group"
                  >
                    <span className="group-hover:text-cobalt transition-colors">{quiz.title} (quiz)</span>
                    <span className="text-xs text-ink-faint">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {(modules ?? []).length === 0 && (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
            No content has been added to this course yet.
          </p>
        )}
      </div>
    </div>
  );
}

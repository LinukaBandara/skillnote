"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function enrollInCourse(courseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.from("enrollments").insert({
    student_id: user.id,
    course_id: courseId,
  });

  revalidatePath(`/courses/${courseId}`);
}

export async function markLessonComplete(lessonId: string, courseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.from("lesson_progress").upsert(
    {
      student_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "student_id,lesson_id" }
  );

  // Check if all lessons in the course are now complete -> issue certificate
  const { data: modules } = await supabase
    .from("modules")
    .select("id, lessons(id)")
    .eq("course_id", courseId);

  const allLessonIds = (modules ?? []).flatMap(
    (m: { lessons: { id: string }[] }) => m.lessons.map((l) => l.id)
  );

  if (allLessonIds.length > 0) {
    const { data: progressRows } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed")
      .eq("student_id", user.id)
      .in("lesson_id", allLessonIds)
      .eq("completed", true);

    const completedCount = progressRows?.length ?? 0;

    if (completedCount === allLessonIds.length) {
      await supabase.from("certificates").upsert(
        { student_id: user.id, course_id: courseId },
        { onConflict: "student_id,course_id" }
      );
      await supabase
        .from("enrollments")
        .update({ completed_at: new Date().toISOString() })
        .eq("student_id", user.id)
        .eq("course_id", courseId);
    }
  }

  revalidatePath(`/courses/${courseId}`);
}

export async function submitQuizAttempt(
  quizId: string,
  courseId: string,
  answers: number[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("position");

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();

  const qs = questions ?? [];
  const correctCount = qs.filter(
    (q, i) => q.correct_index === answers[i]
  ).length;
  const score = qs.length > 0 ? Math.round((correctCount / qs.length) * 100) : 0;
  const passed = score >= (quiz?.passing_score ?? 70);

  await supabase.from("quiz_attempts").insert({
    student_id: user.id,
    quiz_id: quizId,
    score,
    passed,
    answers,
  });

  revalidatePath(`/courses/${courseId}`);
  return { score, passed };
}

export async function createDiscussionThread(
  courseId: string,
  title: string,
  firstComment: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: thread } = await supabase
    .from("discussion_threads")
    .insert({ course_id: courseId, student_id: user.id, title })
    .select()
    .single();

  if (thread) {
    await supabase.from("discussion_comments").insert({
      thread_id: thread.id,
      author_id: user.id,
      content: firstComment,
    });
  }

  revalidatePath(`/courses/${courseId}/discussions`);
  if (thread) redirect(`/courses/${courseId}/discussions/${thread.id}`);
}

export async function addComment(
  threadId: string,
  courseId: string,
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.from("discussion_comments").insert({
    thread_id: threadId,
    author_id: user.id,
    content,
  });

  revalidatePath(`/courses/${courseId}/discussions/${threadId}`);
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MAX_ANSWERS = 100;
const MAX_TITLE_LENGTH = 160;
const MAX_COMMENT_LENGTH = 5000;

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function enrollInCourse(courseId: string) {
  const { supabase, user } = await requireUser();
  await enforceRateLimit(supabase, user.id, "course_enroll", 20, 3600);
  if (!courseId || courseId.length > 100) return;

  const { data: course } = await supabase.from("courses").select("id").eq("id", courseId).single();
  if (!course) return;

  const { error } = await supabase.from("enrollments").upsert(
    { student_id: user.id, course_id: courseId },
    { onConflict: "student_id,course_id", ignoreDuplicates: true }
  );
  if (error) throw new Error("Unable to enroll in the course.");

  revalidatePath(`/courses/${courseId}`);
}

export async function markLessonComplete(lessonId: string, courseId: string) {
  const { supabase, user } = await requireUser();
  await enforceRateLimit(supabase, user.id, "lesson_complete", 120, 3600);
  if (!lessonId || !courseId) return;

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, modules!inner(course_id)")
    .eq("id", lessonId)
    .eq("modules.course_id", courseId)
    .single();
  if (!lesson) return;

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (!enrollment) return;

  const { error: progressError } = await supabase.from("lesson_progress").upsert(
    {
      student_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "student_id,lesson_id" }
  );
  if (progressError) throw new Error("Unable to save lesson progress.");

  const { data: modules } = await supabase
    .from("modules")
    .select("id, lessons(id)")
    .eq("course_id", courseId);

  const allLessonIds = (modules ?? []).flatMap(
    (m: { lessons: { id: string }[] | null }) => (m.lessons ?? []).map((l) => l.id)
  );

  if (allLessonIds.length > 0) {
    const { data: progressRows } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed")
      .eq("student_id", user.id)
      .in("lesson_id", allLessonIds)
      .eq("completed", true);

    if ((progressRows?.length ?? 0) === allLessonIds.length) {
      await supabase.from("certificates").upsert(
        { student_id: user.id, course_id: courseId },
        { onConflict: "student_id,course_id" }
      );
      await supabase
        .from("enrollments")
        .update({ completed_at: new Date().toISOString() })
        .eq("student_id", user.id)
        .eq("course_id", courseId);

      const { data: course } = await supabase.from("courses").select("title").eq("id", courseId).single();
      await supabase.rpc("create_notification", {
        target_user: user.id,
        n_type: "certificate_issued",
        n_title: "Certificate earned",
        n_body: course ? `You completed ${course.title}` : "You completed a course",
        n_link: `/courses/${courseId}/certificate`,
      });
    }
  }

  revalidatePath(`/courses/${courseId}`);
}

export async function submitQuizAttempt(
  quizId: string,
  courseId: string,
  answers: number[]
) {
  const { supabase, user } = await requireUser();
  await enforceRateLimit(supabase, user.id, "quiz_attempt", 30, 3600);
  if (!quizId || !courseId || !Array.isArray(answers) || answers.length > MAX_ANSWERS) {
    return { score: 0, passed: false };
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, passing_score, modules!inner(course_id)")
    .eq("id", quizId)
    .eq("modules.course_id", courseId)
    .single();
  if (!quiz) return { score: 0, passed: false };

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (!enrollment) return { score: 0, passed: false };

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, correct_index, options")
    .eq("quiz_id", quizId)
    .order("position");

  const qs = questions ?? [];
  const normalizedAnswers = qs.map((q, i) => {
    const value = answers[i];
    const options = Array.isArray(q.options) ? q.options : [];
    return Number.isInteger(value) && value >= 0 && (options.length === 0 || value < options.length) ? value : null;
  });
  const correctCount = qs.filter((q, i) => normalizedAnswers[i] === q.correct_index).length;
  const score = qs.length > 0 ? Math.round((correctCount / qs.length) * 100) : 0;
  const passed = score >= (quiz.passing_score ?? 70);

  const { error: attemptError } = await supabase.from("quiz_attempts").insert({
    student_id: user.id,
    quiz_id: quizId,
    score,
    passed,
    answers: normalizedAnswers,
  });
  if (attemptError) throw new Error("Unable to save quiz attempt.");

  revalidatePath(`/courses/${courseId}`);
  return { score, passed };
}

export async function createDiscussionThread(
  courseId: string,
  title: string,
  firstComment: string
) {
  const { supabase, user } = await requireUser();
  await enforceRateLimit(supabase, user.id, "discussion_thread", 10, 3600);
  title = String(title ?? "").trim().slice(0, MAX_TITLE_LENGTH);
  firstComment = String(firstComment ?? "").trim().slice(0, MAX_COMMENT_LENGTH);
  if (!courseId || !title || !firstComment) return;

  const { data: enrollment } = await supabase.from("enrollments").select("id").eq("student_id", user.id).eq("course_id", courseId).maybeSingle();
  if (!enrollment) return;

  const { data: thread } = await supabase
    .from("discussion_threads")
    .insert({ course_id: courseId, student_id: user.id, title })
    .select()
    .single();

  if (thread) {
    const { error } = await supabase.from("discussion_comments").insert({ thread_id: thread.id, author_id: user.id, content: firstComment });
    if (error) throw new Error("Unable to save discussion comment.");
  }

  revalidatePath(`/courses/${courseId}/discussions`);
  if (thread) redirect(`/courses/${courseId}/discussions/${thread.id}`);
}

export async function addComment(threadId: string, courseId: string, content: string) {
  const { supabase, user } = await requireUser();
  await enforceRateLimit(supabase, user.id, "discussion_comment", 30, 3600);
  content = String(content ?? "").trim().slice(0, MAX_COMMENT_LENGTH);
  if (!threadId || !courseId || !content) return;

  const { data: thread } = await supabase
    .from("discussion_threads")
    .select("student_id, title, course_id")
    .eq("id", threadId)
    .eq("course_id", courseId)
    .single();
  if (!thread) return;

  const { data: enrollment } = await supabase.from("enrollments").select("id").eq("student_id", user.id).eq("course_id", courseId).maybeSingle();
  if (!enrollment) return;

  const { error } = await supabase.from("discussion_comments").insert({ thread_id: threadId, author_id: user.id, content });
  if (error) throw new Error("Unable to save discussion comment.");

  if (thread.student_id !== user.id) {
    await supabase.rpc("create_notification", {
      target_user: thread.student_id,
      n_type: "discussion_reply",
      n_title: "New reply",
      n_body: `Someone replied to "${thread.title}"`,
      n_link: `/courses/${courseId}/discussions/${threadId}`,
    });
  }

  revalidatePath(`/courses/${courseId}/discussions/${threadId}`);
}

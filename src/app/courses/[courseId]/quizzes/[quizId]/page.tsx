import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import Link from "next/link";
import { QuizClient } from "./QuizClient";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const { courseId, quizId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
  if (!quiz) notFound();

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("position");

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link href={`/courses/${courseId}`} className="text-sm text-ink-soft hover:text-ink">
        ← Back to course
      </Link>
      <h1 className="text-[25px] font-semibold tracking-[-0.025em] mt-6 mb-8">{quiz.title}</h1>

      {(questions ?? []).length === 0 ? (
        <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
          This quiz doesn&rsquo;t have any questions yet.
        </p>
      ) : (
        <QuizClient
          questions={(questions ?? []) as { id: string; question: string; options: string[] }[]}
          quizId={quizId}
          courseId={courseId}
          passingScore={quiz.passing_score}
        />
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/dashboard/AppShell";
import { addQuestionToExam, removeQuestionFromExam } from "../actions";

export default async function MockExamBuilderPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const { data: exam } = await supabase.from("mock_exams").select("*, subjects(name)").eq("id", examId).single();
  if (!exam) notFound();

  const { data: attachedRaw } = await supabase
    .from("mock_exam_questions")
    .select("question_id, questions(id, question_text)")
    .eq("mock_exam_id", examId)
    .order("position");

  const attached = (attachedRaw ?? []).map((a) => ({
    question_id: a.question_id,
    question: Array.isArray(a.questions) ? a.questions[0] : a.questions,
  })) as { question_id: string; question: { id: string; question_text: string } | null }[];

  const attachedIds = new Set(attached.map((a) => a.question_id));

  const { data: allQuestions } = await supabase
    .from("questions")
    .select("id, question_text, difficulty")
    .eq("subject_id", exam.subject_id)
    .order("created_at", { ascending: false });

  const availableQuestions = (allQuestions ?? []).filter((q) => !attachedIds.has(q.id));

  return (
    <AppShell activeHref="/admin/mock-exams" isStaff showInstitutes={profile.role !== "teacher"}>
      <div className="max-w-2xl px-6 md:px-8 py-10">
        <Link href="/admin/mock-exams" className="text-sm text-ink-soft hover:text-ink">
          ← Mock exams
        </Link>
        <h1 className="text-2xl font-semibold mt-4 mb-1">{exam.title}</h1>
        <p className="text-ink-soft mb-10 text-sm">
          {exam.subjects?.name} · {exam.duration_minutes} minutes · {attached.length} question{attached.length === 1 ? "" : "s"}
        </p>

        <h2 className="section-label mb-3">In this exam</h2>
        {attached.length === 0 ? (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1 mb-10">
            No questions added yet — add from the question bank below.
          </p>
        ) : (
          <ul className="border-t border-rule mb-10">
            {attached.map((a) => (
              <li key={a.question_id} className="border-b border-rule py-3 flex items-center justify-between gap-4">
                <p className="text-sm">{a.question?.question_text}</p>
                <form action={async () => { "use server"; await removeQuestionFromExam(examId, a.question_id); }}>
                  <button type="submit" className="text-xs text-ink-faint hover:text-red-500 shrink-0">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <h2 className="section-label mb-3">Add from question bank</h2>
        {availableQuestions.length === 0 ? (
          <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
            No more questions available for this subject.{" "}
            <Link href={`/admin/questions?subject_id=${exam.subject_id}`} className="text-cobalt underline">
              Add some to the question bank →
            </Link>
          </p>
        ) : (
          <ul className="border-t border-rule">
            {availableQuestions.map((q) => (
              <li key={q.id} className="border-b border-rule py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm">{q.question_text}</p>
                  <p className="text-xs text-ink-faint mt-0.5">{q.difficulty}</p>
                </div>
                <form action={async () => { "use server"; await addQuestionToExam(examId, q.id); }}>
                  <button type="submit" className="text-xs text-cobalt font-medium shrink-0">
                    + Add
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

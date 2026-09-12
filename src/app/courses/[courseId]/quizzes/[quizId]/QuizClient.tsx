"use client";

import { useState } from "react";
import { submitQuizAttempt } from "@/app/courses/actions";
import Link from "next/link";

interface Question {
  id: string;
  question: string;
  options: string[];
}

export function QuizClient({
  questions,
  quizId,
  courseId,
  passingScore,
}: {
  questions: Question[];
  quizId: string;
  courseId: string;
  passingScore: number;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const ordered = questions.map((_, i) => answers[i]);
    const res = await submitQuizAttempt(quizId, courseId, ordered);
    setResult(res);
    setSubmitting(false);
  }

  if (result) {
    return (
      <div className="clay p-8 text-center">
        <p className="stat-serif text-4xl mb-2">{result.score}%</p>
        <p className={`text-sm mb-6 ${result.passed ? "text-sage" : "text-ink-soft"}`}>
          {result.passed ? `Passed (need ${passingScore}%)` : `Not yet — need ${passingScore}% to pass`}
        </p>
        <Link href={`/courses/${courseId}`} className="btn-primary inline-block px-5 py-2.5 rounded-full text-sm font-medium">
          Back to course
        </Link>
      </div>
    );
  }

  const allAnswered = questions.every((_, i) => answers[i] !== undefined);

  return (
    <div className="space-y-8">
      {questions.map((q, qi) => (
        <div key={q.id} className="clay p-6">
          <p className="text-sm mb-4">{qi + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                  answers[qi] === oi ? "border-cobalt bg-cobalt/5" : "border-rule"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="btn-primary px-6 py-3 rounded-full text-sm font-medium disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Submit quiz"}
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitMockExam } from "../actions";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
}

export function MockExamRunner({
  questions,
  attemptId,
  subjectId,
  examId,
  durationMinutes,
}: {
  questions: Question[];
  attemptId: string;
  subjectId: string;
  examId: string;
  durationMinutes: number;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef<number | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (startTime.current === null) {
      startTime.current = Date.now();
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - (startTime.current ?? Date.now())) / 1000);
    const payload = questions.map((q, i) => ({
      questionId: q.id,
      selectedIndex: answers[i],
      correctIndex: q.correct_index,
    }));
    await submitMockExam(attemptId, payload, timeTaken);
    router.push(`/subjects/${subjectId}/mock-exams?attemptId=${attemptId}`);
  }, [answers, questions, attemptId, subjectId, examId, router]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, handleSubmit]);

  const q = questions[index];
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="grid md:grid-cols-[1fr_200px] gap-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-ink-faint">Question {index + 1} of {questions.length}</span>
          <span className={`text-sm font-medium ${secondsLeft < 60 ? "text-red-500" : "text-ink"}`}>
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>

        <div className="clay p-6 mb-4">
          <p className="text-base mb-6">{q.question_text}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => setAnswers((a) => ({ ...a, [index]: oi }))}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                  answers[index] === oi ? "border-cobalt bg-cobalt/5" : "border-rule"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="text-sm text-ink-soft hover:text-ink disabled:opacity-30"
          >
            ← Previous
          </button>
          <button
            onClick={() =>
              setFlagged((f) => {
                const next = new Set(f);
                if (next.has(index)) next.delete(index);
                else next.add(index);
                return next;
              })
            }
            className={`text-xs px-3 py-1.5 rounded-full border ${
              flagged.has(index) ? "border-butter bg-butter/20 text-ink" : "border-rule text-ink-faint"
            }`}
          >
            {flagged.has(index) ? "Flagged for review" : "Mark for review"}
          </button>
          {index < questions.length - 1 ? (
            <button onClick={() => setIndex((i) => i + 1)} className="text-sm text-ink-soft hover:text-ink">
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary px-5 py-2 rounded-full text-sm font-medium"
            >
              {submitting ? "Submitting…" : "Submit exam"}
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="section-label mb-3">{answeredCount}/{questions.length} answered</p>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((_, i) => {
            const isAnswered = answers[i] !== undefined;
            const isFlagged = flagged.has(i);
            const isCurrent = i === index;
            return (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center border transition-colors ${
                  isCurrent
                    ? "border-cobalt bg-cobalt text-white"
                    : isFlagged
                    ? "border-butter bg-butter/20"
                    : isAnswered
                    ? "border-sage/40 bg-sage/10"
                    : "border-rule"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-6 btn-primary py-2.5 rounded-full text-sm font-medium"
        >
          {submitting ? "Submitting…" : "Submit exam"}
        </button>
      </div>
    </div>
  );
}

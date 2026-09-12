"use client";

import { useState } from "react";
import { submitQuestionAttempt } from "./actions";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  year: number | null;
  difficulty: string;
  source: string | null;
}

export function PracticeClient({
  questions,
  subjectId,
}: {
  questions: Question[];
  subjectId: string;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [submitting, setSubmitting] = useState(false);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const isDone = index >= questions.length;

  if (questions.length === 0) {
    return (
      <p className="text-ink-soft text-sm border-l-2 border-rule pl-4 py-1">
        No questions match these filters yet.
      </p>
    );
  }

  if (isDone) {
    return (
      <div className="clay p-8 text-center">
        <p className="stat-serif text-4xl mb-2">
          {score.correct}/{score.total}
        </p>
        <p className="text-ink-soft text-sm mb-6">questions answered correctly</p>
        <button
          onClick={() => {
            setIndex(0);
            setSelected(null);
            setRevealed(false);
            setScore({ correct: 0, total: 0 });
          }}
          className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium"
        >
          Practice again
        </button>
      </div>
    );
  }

  async function handleSelect(i: number) {
    if (revealed || submitting) return;
    setSelected(i);
    setSubmitting(true);
    const result = await submitQuestionAttempt(question.id, subjectId, i, question.correct_index);
    setScore((s) => ({
      correct: s.correct + (result.isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
    setRevealed(true);
    setSubmitting(false);
  }

  function handleNext() {
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 text-xs text-ink-faint">
        <span>Question {index + 1} of {questions.length}</span>
        {question.year && <span>{question.source ?? `${question.year} past paper`}</span>}
      </div>

      <div className="clay p-6 mb-4">
        <p className="text-base mb-6">{question.question_text}</p>
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const isCorrectOption = i === question.correct_index;
            const isSelected = i === selected;
            let style = "border-rule";
            if (revealed) {
              if (isCorrectOption) style = "border-sage bg-sage/5";
              else if (isSelected) style = "border-red-400 bg-red-50";
            } else if (isSelected) {
              style = "border-cobalt";
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={revealed}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {revealed && (
        <button
          onClick={handleNext}
          className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium"
        >
          {isLast ? "See results" : "Next question"}
        </button>
      )}
    </div>
  );
}

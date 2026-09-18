alter table public.quiz_attempts
  add constraint quiz_attempts_score_range check (score between 0 and 100);

alter table public.mock_exam_attempts
  add constraint mock_exam_attempts_score_range check (score is null or score between 0 and 100);

alter table public.mock_exam_attempts
  add constraint mock_exam_attempts_counts_valid check (
    total_questions >= 0
    and (correct_count is null or (correct_count >= 0 and correct_count <= total_questions))
  );

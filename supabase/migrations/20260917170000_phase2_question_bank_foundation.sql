-- Skill Note — Phase 2 Question Bank Foundation
-- Aligns questions with the versioned academic hierarchy and adds provenance/review metadata.

alter table public.questions
  add column if not exists syllabus_version_id uuid references public.syllabus_versions(id) on delete set null,
  add column if not exists competency_id uuid references public.syllabus_competencies(id) on delete set null,
  add column if not exists competency_level_id uuid references public.syllabus_competency_levels(id) on delete set null,
  add column if not exists subtopic_id uuid references public.syllabus_subtopics(id) on delete set null,
  add column if not exists learning_outcome_id uuid references public.syllabus_learning_outcomes(id) on delete set null,
  add column if not exists explanation text,
  add column if not exists estimated_time_seconds integer,
  add column if not exists paper_number integer,
  add column if not exists section text,
  add column if not exists source_type text not null default 'teacher_authored',
  add column if not exists source_reference text,
  add column if not exists licensing_status text not null default 'unknown',
  add column if not exists review_status text not null default 'draft',
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists tags text[] not null default '{}';

alter table public.questions drop constraint if exists questions_question_type_check;
alter table public.questions add constraint questions_question_type_check
  check (question_type in ('mcq','true_false','short_answer','structured','essay','numerical','practical'));

alter table public.questions drop constraint if exists questions_difficulty_check;
alter table public.questions add constraint questions_difficulty_check
  check (difficulty in ('easy','medium','hard'));

alter table public.questions drop constraint if exists questions_review_status_check;
alter table public.questions add constraint questions_review_status_check
  check (review_status in ('draft','review','approved','published','archived'));

alter table public.questions drop constraint if exists questions_source_type_check;
alter table public.questions add constraint questions_source_type_check
  check (source_type in ('official','licensed','teacher_authored','skill_note_authored','ai_assisted'));

alter table public.questions drop constraint if exists questions_licensing_status_check;
alter table public.questions add constraint questions_licensing_status_check
  check (licensing_status in ('unknown','owned','licensed','public_domain','restricted','not_for_distribution'));

alter table public.questions drop constraint if exists questions_estimated_time_check;
alter table public.questions add constraint questions_estimated_time_check
  check (estimated_time_seconds is null or estimated_time_seconds > 0);

alter table public.questions drop constraint if exists questions_marks_check;
alter table public.questions add constraint questions_marks_check
  check (marks > 0);

create index if not exists idx_questions_academic_scope
  on public.questions(syllabus_version_id, subject_id, topic_id);
create index if not exists idx_questions_learning_outcome
  on public.questions(learning_outcome_id);
create index if not exists idx_questions_review_status
  on public.questions(review_status);
create index if not exists idx_questions_source_type
  on public.questions(source_type);
create index if not exists idx_questions_difficulty
  on public.questions(difficulty);

create table if not exists public.question_review_history (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  from_status text,
  to_status text not null,
  reviewer_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.question_review_history enable row level security;

drop policy if exists "Staff can read question review history" on public.question_review_history;
create policy "Staff can read question review history"
  on public.question_review_history for select
  to authenticated
  using ((select is_teacher_or_above()));

drop policy if exists "Staff can create question review history" on public.question_review_history;
create policy "Staff can create question review history"
  on public.question_review_history for insert
  to authenticated
  with check ((select is_teacher_or_above()));

create index if not exists idx_question_review_history_question
  on public.question_review_history(question_id, created_at desc);

comment on table public.question_review_history is 'Audit trail for question content review status changes.';

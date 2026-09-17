create table if not exists public.exam_series (
  id uuid primary key default gen_random_uuid(), title text not null,
  syllabus_version_id uuid references public.syllabus_versions(id) on delete set null,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  exam_year integer, series_name text,
  source_type text not null default 'official' check (source_type in ('official','licensed','teacher_authored','skill_note_authored','ai_assisted')),
  source_reference text,
  licensing_status text not null default 'unknown' check (licensing_status in ('unknown','owned','licensed','public_domain','restricted','not_for_distribution')),
  review_status text not null default 'draft' check (review_status in ('draft','review','approved','published','archived')),
  reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(), exam_series_id uuid not null references public.exam_series(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  syllabus_version_id uuid references public.syllabus_versions(id) on delete set null,
  paper_number integer not null check (paper_number > 0), medium text not null default 'english',
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0), total_marks integer check (total_marks is null or total_marks > 0),
  source text, source_reference text,
  source_type text not null default 'official' check (source_type in ('official','licensed','teacher_authored','skill_note_authored','ai_assisted')),
  licensing_status text not null default 'unknown' check (licensing_status in ('unknown','owned','licensed','public_domain','restricted','not_for_distribution')),
  review_status text not null default 'draft' check (review_status in ('draft','review','approved','published','archived')),
  reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (exam_series_id, paper_number, medium)
);
create table if not exists public.paper_sections (
  id uuid primary key default gen_random_uuid(), paper_id uuid not null references public.papers(id) on delete cascade,
  code text, title text not null, instructions text, position integer not null check (position > 0), marks integer check (marks is null or marks > 0), created_at timestamptz not null default now(),
  unique (paper_id, position), unique (paper_id, code)
);
create table if not exists public.paper_questions (
  id uuid primary key default gen_random_uuid(), section_id uuid not null references public.paper_sections(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict, question_number text not null, position integer not null check (position > 0),
  marks integer check (marks is null or marks > 0), is_required boolean not null default true, choice_group text, instructions text, created_at timestamptz not null default now(),
  unique (section_id, position), unique (section_id, question_number)
);
create table if not exists public.question_marking_schemes (
  id uuid primary key default gen_random_uuid(), question_id uuid not null unique references public.questions(id) on delete cascade,
  total_marks integer not null check (total_marks > 0), marking_notes text, created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null, review_status text not null default 'draft' check (review_status in ('draft','review','approved','published','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.marking_scheme_points (
  id uuid primary key default gen_random_uuid(), marking_scheme_id uuid not null references public.question_marking_schemes(id) on delete cascade,
  position integer not null check (position > 0), criterion text not null, expected_answer text, marks integer not null check (marks > 0), marking_notes text,
  allow_partial_credit boolean not null default false, created_at timestamptz not null default now(), unique (marking_scheme_id, position)
);
create index if not exists idx_exam_series_subject_year on public.exam_series(subject_id, exam_year);
create index if not exists idx_exam_series_syllabus_version on public.exam_series(syllabus_version_id);
create index if not exists idx_exam_series_review_status on public.exam_series(review_status);
create index if not exists idx_papers_exam_series on public.papers(exam_series_id);
create index if not exists idx_papers_subject on public.papers(subject_id);
create index if not exists idx_papers_review_status on public.papers(review_status);
create index if not exists idx_paper_sections_paper on public.paper_sections(paper_id, position);
create index if not exists idx_paper_questions_section on public.paper_questions(section_id, position);
create index if not exists idx_paper_questions_question on public.paper_questions(question_id);
create index if not exists idx_marking_scheme_points_scheme on public.marking_scheme_points(marking_scheme_id, position);
alter table public.exam_series enable row level security;
alter table public.papers enable row level security;
alter table public.paper_sections enable row level security;
alter table public.paper_questions enable row level security;
alter table public.question_marking_schemes enable row level security;
alter table public.marking_scheme_points enable row level security;
create policy "Published exam series are readable" on public.exam_series for select to authenticated using (review_status = 'published' or is_teacher_or_above());
create policy "Staff manage exam series" on public.exam_series for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
create policy "Published papers are readable" on public.papers for select to authenticated using (review_status = 'published' or is_teacher_or_above());
create policy "Staff manage papers" on public.papers for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
create policy "Published paper sections are readable" on public.paper_sections for select to authenticated using (exists (select 1 from public.papers p where p.id = paper_id and (p.review_status = 'published' or is_teacher_or_above())));
create policy "Staff manage paper sections" on public.paper_sections for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
create policy "Published paper questions are readable" on public.paper_questions for select to authenticated using (exists (select 1 from public.paper_sections s join public.papers p on p.id = s.paper_id where s.id = section_id and (p.review_status = 'published' or is_teacher_or_above())));
create policy "Staff manage paper questions" on public.paper_questions for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
create policy "Published marking schemes are readable" on public.question_marking_schemes for select to authenticated using (review_status = 'published' or is_teacher_or_above());
create policy "Staff manage marking schemes" on public.question_marking_schemes for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
create policy "Published marking points are readable" on public.marking_scheme_points for select to authenticated using (exists (select 1 from public.question_marking_schemes ms where ms.id = marking_scheme_id and (ms.review_status = 'published' or is_teacher_or_above())));
create policy "Staff manage marking points" on public.marking_scheme_points for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
grant select, insert, update, delete on public.exam_series, public.papers, public.paper_sections, public.paper_questions, public.question_marking_schemes, public.marking_scheme_points to authenticated;

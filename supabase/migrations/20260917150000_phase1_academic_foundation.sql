-- Skill Note — Phase 1 Academic Foundation
-- Adds versioned academic structure without replacing the existing
-- streams -> subjects -> units -> topics model.

create table if not exists public.syllabus_versions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  academic_year_from integer,
  academic_year_to integer,
  is_active boolean not null default false,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint syllabus_versions_year_check
    check (
      academic_year_from is null
      or academic_year_to is null
      or academic_year_to >= academic_year_from
    )
);

-- A subject can participate in more than one syllabus version over time.
create table if not exists public.syllabus_version_subjects (
  id uuid primary key default gen_random_uuid(),
  syllabus_version_id uuid not null references public.syllabus_versions(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (syllabus_version_id, subject_id)
);

-- Academic competencies belong to a versioned subject.
create table if not exists public.syllabus_competencies (
  id uuid primary key default gen_random_uuid(),
  syllabus_version_id uuid not null references public.syllabus_versions(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  unique (syllabus_version_id, subject_id, code),
  unique (id, syllabus_version_id, subject_id)
);

-- Competency levels describe the expected progression inside a competency.
create table if not exists public.syllabus_competency_levels (
  id uuid primary key default gen_random_uuid(),
  competency_id uuid not null references public.syllabus_competencies(id) on delete cascade,
  syllabus_version_id uuid not null references public.syllabus_versions(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  unique (competency_id, code),
  foreign key (competency_id, syllabus_version_id, subject_id)
    references public.syllabus_competencies(id, syllabus_version_id, subject_id)
    on delete cascade
);

-- Existing units remain intact. New versioned units can point at a syllabus version.
alter table public.syllabus_units
  add column if not exists syllabus_version_id uuid references public.syllabus_versions(id) on delete set null;

-- Existing topics remain intact. Subtopics provide the next level of academic detail.
create table if not exists public.syllabus_subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.syllabus_topics(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  unique (topic_id, position),
  unique (topic_id, title)
);

-- Learning outcomes are the smallest academic target used by future mastery logic.
create table if not exists public.syllabus_learning_outcomes (
  id uuid primary key default gen_random_uuid(),
  subtopic_id uuid not null references public.syllabus_subtopics(id) on delete cascade,
  competency_id uuid references public.syllabus_competencies(id) on delete set null,
  competency_level_id uuid references public.syllabus_competency_levels(id) on delete set null,
  code text,
  statement text not null,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  unique (subtopic_id, position),
  unique (subtopic_id, code)
);

create index if not exists idx_syllabus_version_subjects_subject
  on public.syllabus_version_subjects(subject_id);

create index if not exists idx_syllabus_competencies_version_subject
  on public.syllabus_competencies(syllabus_version_id, subject_id, position);

create index if not exists idx_syllabus_competency_levels_competency
  on public.syllabus_competency_levels(competency_id, position);

create index if not exists idx_syllabus_units_version
  on public.syllabus_units(syllabus_version_id);

create index if not exists idx_syllabus_subtopics_topic
  on public.syllabus_subtopics(topic_id, position);

create index if not exists idx_syllabus_learning_outcomes_subtopic
  on public.syllabus_learning_outcomes(subtopic_id, position);

create index if not exists idx_syllabus_learning_outcomes_competency
  on public.syllabus_learning_outcomes(competency_id);

-- Keep exposed academic tables protected by RLS.
alter table public.syllabus_versions enable row level security;
alter table public.syllabus_version_subjects enable row level security;
alter table public.syllabus_competencies enable row level security;
alter table public.syllabus_competency_levels enable row level security;
alter table public.syllabus_units enable row level security;
alter table public.syllabus_subtopics enable row level security;
alter table public.syllabus_learning_outcomes enable row level security;

-- Authenticated students/teachers need to read the academic structure.
drop policy if exists "Authenticated users can read syllabus versions" on public.syllabus_versions;
create policy "Authenticated users can read syllabus versions"
  on public.syllabus_versions for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read syllabus version subjects" on public.syllabus_version_subjects;
create policy "Authenticated users can read syllabus version subjects"
  on public.syllabus_version_subjects for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read syllabus competencies" on public.syllabus_competencies;
create policy "Authenticated users can read syllabus competencies"
  on public.syllabus_competencies for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read competency levels" on public.syllabus_competency_levels;
create policy "Authenticated users can read competency levels"
  on public.syllabus_competency_levels for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read syllabus subtopics" on public.syllabus_subtopics;
create policy "Authenticated users can read syllabus subtopics"
  on public.syllabus_subtopics for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read learning outcomes" on public.syllabus_learning_outcomes;
create policy "Authenticated users can read learning outcomes"
  on public.syllabus_learning_outcomes for select
  to authenticated
  using (true);

-- Existing syllabus units already have application policies in the project.
-- Only add a read policy when one does not already exist.
drop policy if exists "Authenticated users can read syllabus units" on public.syllabus_units;
create policy "Authenticated users can read syllabus units"
  on public.syllabus_units for select
  to authenticated
  using (true);

-- Platform administrators manage academic structure. No student/teacher writes.
drop policy if exists "Platform admins manage syllabus versions" on public.syllabus_versions;
create policy "Platform admins manage syllabus versions"
  on public.syllabus_versions for all
  to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

drop policy if exists "Platform admins manage syllabus version subjects" on public.syllabus_version_subjects;
create policy "Platform admins manage syllabus version subjects"
  on public.syllabus_version_subjects for all
  to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

drop policy if exists "Platform admins manage syllabus competencies" on public.syllabus_competencies;
create policy "Platform admins manage syllabus competencies"
  on public.syllabus_competencies for all
  to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

drop policy if exists "Platform admins manage competency levels" on public.syllabus_competency_levels;
create policy "Platform admins manage competency levels"
  on public.syllabus_competency_levels for all
  to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

drop policy if exists "Platform admins manage syllabus units" on public.syllabus_units;
create policy "Platform admins manage syllabus units"
  on public.syllabus_units for all
  to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

drop policy if exists "Platform admins manage syllabus subtopics" on public.syllabus_subtopics;
create policy "Platform admins manage syllabus subtopics"
  on public.syllabus_subtopics for all
  to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

drop policy if exists "Platform admins manage learning outcomes" on public.syllabus_learning_outcomes;
create policy "Platform admins manage learning outcomes"
  on public.syllabus_learning_outcomes for all
  to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

comment on table public.syllabus_versions is 'Versioned Sri Lankan A/L syllabus definitions. Do not treat a version as official unless its source is verified.';
comment on table public.syllabus_competencies is 'Subject-level competencies for a specific syllabus version.';
comment on table public.syllabus_competency_levels is 'Competency levels for a specific syllabus version.';
comment on table public.syllabus_subtopics is 'Optional finer-grained structure beneath the existing syllabus topic.';
comment on table public.syllabus_learning_outcomes is 'Measurable learning targets used later for lesson alignment and mastery.';

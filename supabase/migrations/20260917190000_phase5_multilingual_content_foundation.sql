create table if not exists public.content_languages (
  code text primary key,
  name text not null unique,
  native_name text not null,
  direction text not null default 'ltr' check (direction in ('ltr','rtl')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.content_languages (code,name,native_name,direction)
values ('en','English','English','ltr'),('si','Sinhala','සිංහල','ltr'),('ta','Tamil','தமிழ்','ltr')
on conflict (code) do update set name=excluded.name,native_name=excluded.native_name,direction=excluded.direction;

alter table public.profiles add column if not exists preferred_language text references public.content_languages(code);
update public.profiles set preferred_language = case medium when 'sinhala' then 'si' when 'tamil' then 'ta' else 'en' end where preferred_language is null;

create table if not exists public.syllabus_unit_translations (
  unit_id uuid not null references public.syllabus_units(id) on delete cascade,
  language_code text not null references public.content_languages(code) on delete cascade,
  title text not null,
  primary key (unit_id, language_code)
);
create table if not exists public.syllabus_topic_translations (
  topic_id uuid not null references public.syllabus_topics(id) on delete cascade,
  language_code text not null references public.content_languages(code) on delete cascade,
  title text not null,
  primary key (topic_id, language_code)
);
create table if not exists public.syllabus_subtopic_translations (
  subtopic_id uuid not null references public.syllabus_subtopics(id) on delete cascade,
  language_code text not null references public.content_languages(code) on delete cascade,
  title text not null,
  description text,
  primary key (subtopic_id, language_code)
);
create table if not exists public.syllabus_learning_outcome_translations (
  learning_outcome_id uuid not null references public.syllabus_learning_outcomes(id) on delete cascade,
  language_code text not null references public.content_languages(code) on delete cascade,
  statement text not null,
  primary key (learning_outcome_id, language_code)
);

create table if not exists public.question_translations (
  question_id uuid not null references public.questions(id) on delete cascade,
  language_code text not null references public.content_languages(code) on delete cascade,
  question_text text not null,
  options jsonb,
  model_answer text,
  explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (question_id, language_code)
);

create table if not exists public.course_translations (
  course_id uuid not null references public.courses(id) on delete cascade,
  language_code text not null references public.content_languages(code) on delete cascade,
  title text not null,
  description text,
  primary key (course_id, language_code)
);
create table if not exists public.module_translations (
  module_id uuid not null references public.modules(id) on delete cascade,
  language_code text not null references public.content_languages(code) on delete cascade,
  title text not null,
  primary key (module_id, language_code)
);
create table if not exists public.lesson_translations (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  language_code text not null references public.content_languages(code) on delete cascade,
  title text not null,
  content text,
  primary key (lesson_id, language_code)
);

create index if not exists idx_question_translations_language on public.question_translations(language_code);
create index if not exists idx_learning_outcome_translations_language on public.syllabus_learning_outcome_translations(language_code);

alter table public.content_languages enable row level security;
alter table public.syllabus_unit_translations enable row level security;
alter table public.syllabus_topic_translations enable row level security;
alter table public.syllabus_subtopic_translations enable row level security;
alter table public.syllabus_learning_outcome_translations enable row level security;
alter table public.question_translations enable row level security;
alter table public.course_translations enable row level security;
alter table public.module_translations enable row level security;
alter table public.lesson_translations enable row level security;

create policy "Authenticated users can read active languages" on public.content_languages for select to authenticated using (is_active = true);
create policy "Staff manage languages" on public.content_languages for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());

create policy "Authenticated users read syllabus unit translations" on public.syllabus_unit_translations for select to authenticated using (true);
create policy "Staff manage syllabus unit translations" on public.syllabus_unit_translations for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
create policy "Authenticated users read syllabus topic translations" on public.syllabus_topic_translations for select to authenticated using (true);
create policy "Staff manage syllabus topic translations" on public.syllabus_topic_translations for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
create policy "Authenticated users read syllabus subtopic translations" on public.syllabus_subtopic_translations for select to authenticated using (true);
create policy "Staff manage syllabus subtopic translations" on public.syllabus_subtopic_translations for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
create policy "Authenticated users read learning outcome translations" on public.syllabus_learning_outcome_translations for select to authenticated using (true);
create policy "Staff manage learning outcome translations" on public.syllabus_learning_outcome_translations for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
create policy "Authenticated users read question translations" on public.question_translations for select to authenticated using (true);
create policy "Staff manage question translations" on public.question_translations for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
create policy "Authenticated users read course translations" on public.course_translations for select to authenticated using (true);
create policy "Staff manage course translations" on public.course_translations for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
create policy "Authenticated users read module translations" on public.module_translations for select to authenticated using (true);
create policy "Staff manage module translations" on public.module_translations for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());
create policy "Authenticated users read lesson translations" on public.lesson_translations for select to authenticated using (true);
create policy "Staff manage lesson translations" on public.lesson_translations for all to authenticated using (is_teacher_or_above()) with check (is_teacher_or_above());

grant select on public.content_languages to authenticated;
grant select,insert,update,delete on public.syllabus_unit_translations to authenticated;
grant select,insert,update,delete on public.syllabus_topic_translations to authenticated;
grant select,insert,update,delete on public.syllabus_subtopic_translations to authenticated;
grant select,insert,update,delete on public.syllabus_learning_outcome_translations to authenticated;
grant select,insert,update,delete on public.question_translations to authenticated;
grant select,insert,update,delete on public.course_translations to authenticated;
grant select,insert,update,delete on public.module_translations to authenticated;
grant select,insert,update,delete on public.lesson_translations to authenticated;

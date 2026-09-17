do $$
declare
  t text;
begin
  foreach t in array array[
    'syllabus_unit_translations',
    'syllabus_topic_translations',
    'syllabus_subtopic_translations',
    'syllabus_learning_outcome_translations',
    'question_translations',
    'course_translations',
    'module_translations',
    'lesson_translations'
  ] loop
    execute format('alter table public.%I add column if not exists status text not null default ''draft'' check (status in (''draft'',''review'',''published'',''archived''))', t);
    execute format('alter table public.%I add column if not exists translated_by uuid references auth.users(id)', t);
    execute format('alter table public.%I add column if not exists reviewed_by uuid references auth.users(id)', t);
    execute format('alter table public.%I add column if not exists reviewed_at timestamptz', t);
    execute format('create index if not exists %I on public.%I(status, language_code)', 'idx_' || t || '_status_language', t);
  end loop;
end $$;

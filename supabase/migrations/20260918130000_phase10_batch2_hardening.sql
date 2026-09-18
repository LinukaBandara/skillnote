-- Phase 10 Batch 2 hardening
-- Net security/integrity state applied to production on 2026-09-18.

drop policy if exists "Enrolled students and staff can view assignments" on public.assignments;
drop policy if exists "Staff manage assignments" on public.assignments;
drop policy if exists "Authorized staff manage assignments" on public.assignments;

create policy "Enrolled students and authorized staff can view assignments"
on public.assignments
for select
to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.course_id = assignments.course_id
      and e.student_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.courses c
    where c.id = assignments.course_id
      and (
        (select current_role_name()) = 'platform_admin'
        or ((select current_role_name()) = 'institute_admin'
          and c.institute_id = (select current_institute_id()))
        or ((select current_role_name()) = 'teacher'
          and exists (
            select 1 from public.course_teachers ct
            where ct.course_id = c.id and ct.teacher_id = (select auth.uid())
          ))
      )
  )
);

create policy "Authorized staff manage assignments"
on public.assignments
for all
to authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = assignments.course_id
      and (
        (select current_role_name()) = 'platform_admin'
        or ((select current_role_name()) = 'institute_admin'
          and c.institute_id = (select current_institute_id()))
        or ((select current_role_name()) = 'teacher'
          and exists (
            select 1 from public.course_teachers ct
            where ct.course_id = c.id and ct.teacher_id = (select auth.uid())
          ))
      )
  )
)
with check (
  exists (
    select 1 from public.courses c
    where c.id = assignments.course_id
      and (
        (select current_role_name()) = 'platform_admin'
        or ((select current_role_name()) = 'institute_admin'
          and c.institute_id = (select current_institute_id()))
        or ((select current_role_name()) = 'teacher'
          and exists (
            select 1 from public.course_teachers ct
            where ct.course_id = c.id and ct.teacher_id = (select auth.uid())
          ))
      )
  )
);

drop policy if exists "Staff grade submissions" on public.assignment_submissions;
drop policy if exists "Students view own submissions, staff view all" on public.assignment_submissions;
drop policy if exists "Students view own submissions, staff view assigned" on public.assignment_submissions;
drop policy if exists "Authorized staff grade submissions" on public.assignment_submissions;

create policy "Authorized staff grade submissions"
on public.assignment_submissions
for update
to authenticated
using (
  exists (
    select 1
    from public.assignments a
    join public.courses c on c.id = a.course_id
    where a.id = assignment_submissions.assignment_id
      and (
        (select current_role_name()) = 'platform_admin'
        or ((select current_role_name()) = 'institute_admin'
          and c.institute_id = (select current_institute_id()))
        or ((select current_role_name()) = 'teacher'
          and exists (
            select 1 from public.course_teachers ct
            where ct.course_id = c.id and ct.teacher_id = (select auth.uid())
          ))
      )
  )
)
with check (
  exists (
    select 1
    from public.assignments a
    join public.courses c on c.id = a.course_id
    where a.id = assignment_submissions.assignment_id
      and (
        (select current_role_name()) = 'platform_admin'
        or ((select current_role_name()) = 'institute_admin'
          and c.institute_id = (select current_institute_id()))
        or ((select current_role_name()) = 'teacher'
          and exists (
            select 1 from public.course_teachers ct
            where ct.course_id = c.id and ct.teacher_id = (select auth.uid())
          ))
      )
  )
);

create policy "Students view own submissions, authorized staff view course submissions"
on public.assignment_submissions
for select
to authenticated
using (
  (select auth.uid()) = student_id
  or exists (
    select 1
    from public.assignments a
    join public.courses c on c.id = a.course_id
    where a.id = assignment_submissions.assignment_id
      and (
        (select current_role_name()) = 'platform_admin'
        or ((select current_role_name()) = 'institute_admin'
          and c.institute_id = (select current_institute_id()))
        or ((select current_role_name()) = 'teacher'
          and exists (
            select 1 from public.course_teachers ct
            where ct.course_id = c.id and ct.teacher_id = (select auth.uid())
          ))
      )
  )
);

drop policy if exists "Students create own attempts" on public.question_attempts;
create policy "Students create verified own attempts"
on public.question_attempts
for insert
to authenticated
with check (
  (select auth.uid()) = student_id
  and exists (
    select 1
    from public.questions q
    where q.id = question_attempts.question_id
      and question_attempts.selected_index is not null
      and question_attempts.selected_index >= 0
      and question_attempts.is_correct = (question_attempts.selected_index = q.correct_index)
  )
);

drop policy if exists "Students create own attempts" on public.mock_exam_attempts;
create policy "Students create verified own attempts"
on public.mock_exam_attempts
for insert
to authenticated
with check (
  (select auth.uid()) = student_id
  and exists (
    select 1
    from public.mock_exams me
    where me.id = mock_exam_attempts.mock_exam_id
      and mock_exam_attempts.total_questions = (
        select count(*)::integer
        from public.mock_exam_questions meq
        where meq.mock_exam_id = me.id
      )
      and mock_exam_attempts.total_questions > 0
  )
);

drop policy if exists "Students update own attempts" on public.mock_exam_attempts;
drop policy if exists "Students finalize own in-progress attempts" on public.mock_exam_attempts;

drop policy if exists "Students insert own answers" on public.mock_exam_answers;
create policy "Students insert answers for own exam questions"
on public.mock_exam_answers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.mock_exam_attempts a
    join public.mock_exam_questions meq
      on meq.mock_exam_id = a.mock_exam_id
     and meq.question_id = mock_exam_answers.question_id
    where a.id = mock_exam_answers.attempt_id
      and a.student_id = (select auth.uid())
      and a.submitted_at is null
  )
);

alter table public.mock_exam_attempts
  drop constraint if exists mock_exam_attempts_score_check,
  drop constraint if exists mock_exam_attempts_correct_count_check,
  drop constraint if exists mock_exam_attempts_time_taken_check;

alter table public.mock_exam_attempts
  add constraint mock_exam_attempts_score_check
    check (score is null or (score >= 0 and score <= 100)),
  add constraint mock_exam_attempts_correct_count_check
    check (correct_count is null or (correct_count >= 0 and correct_count <= total_questions)),
  add constraint mock_exam_attempts_time_taken_check
    check (time_taken_seconds is null or (time_taken_seconds >= 0 and time_taken_seconds <= 86400));

create or replace function public.finalize_mock_exam_attempt(p_attempt_id uuid)
returns table(score integer, correct_count integer, time_taken_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_exam_id uuid;
  v_started_at timestamptz;
  v_duration_minutes integer;
  v_total_questions integer;
  v_elapsed integer;
  v_correct integer;
  v_score integer;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  select a.mock_exam_id, a.started_at, me.duration_minutes, a.total_questions
    into v_exam_id, v_started_at, v_duration_minutes, v_total_questions
  from public.mock_exam_attempts a
  join public.mock_exams me on me.id = a.mock_exam_id
  where a.id = p_attempt_id
    and a.student_id = v_user
    and a.submitted_at is null
  for update;

  if not found then raise exception 'Mock exam attempt not found or already submitted'; end if;

  v_elapsed := greatest(0, floor(extract(epoch from (now() - v_started_at)))::integer);
  if v_duration_minutes > 0 and v_elapsed > (v_duration_minutes * 60 + 30) then
    raise exception 'The mock exam time limit has been exceeded';
  end if;

  update public.mock_exam_answers a
  set is_correct = (
    a.selected_index is not null
    and a.selected_index = q.correct_index
  )
  from public.mock_exam_questions meq
  join public.questions q on q.id = meq.question_id
  where a.attempt_id = p_attempt_id
    and meq.mock_exam_id = v_exam_id
    and meq.question_id = a.question_id;

  select count(*)::integer into v_correct
  from public.mock_exam_answers a
  join public.mock_exam_questions meq
    on meq.mock_exam_id = v_exam_id and meq.question_id = a.question_id
  where a.attempt_id = p_attempt_id and a.is_correct = true;

  v_score := case
    when coalesce(v_total_questions, 0) > 0
      then round((v_correct::numeric / v_total_questions::numeric) * 100)::integer
    else 0
  end;

  update public.mock_exam_attempts
  set submitted_at = now(), score = v_score,
      correct_count = v_correct, time_taken_seconds = v_elapsed
  where id = p_attempt_id and student_id = v_user and submitted_at is null;

  return query select v_score, v_correct, v_elapsed;
end;
$$;

revoke all on function public.finalize_mock_exam_attempt(uuid) from public;
revoke all on function public.finalize_mock_exam_attempt(uuid) from anon;
grant execute on function public.finalize_mock_exam_attempt(uuid) to authenticated;

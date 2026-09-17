-- Phase 10: assignment storage and rate-limit hardening

alter table public.assignments
  drop constraint if exists assignments_max_marks_check;
alter table public.assignments
  add constraint assignments_max_marks_check check (max_marks > 0 and max_marks <= 10000);

alter table public.assignment_submissions
  drop constraint if exists assignment_submissions_grade_check;
alter table public.assignment_submissions
  add constraint assignment_submissions_grade_check check (grade is null or grade >= 0);

create index if not exists idx_assignments_course_due on public.assignments(course_id, due_date);
create index if not exists idx_assignment_submissions_assignment_student on public.assignment_submissions(assignment_id, student_id);
create index if not exists idx_assignment_submissions_student_submitted on public.assignment_submissions(student_id, submitted_at desc);

update storage.buckets
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array[
      'application/pdf',
      'image/png',
      'image/jpeg',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
where id = 'assignment-files';

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (qual ilike '%assignment-files%' or with_check ilike '%assignment-files%')
  loop
    execute format('drop policy if exists %I on storage.objects', policy_record.policyname);
  end loop;
end $$;

create policy "assignment files students upload own"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'assignment-files'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
  and exists (
    select 1
    from public.assignments a
    where a.id::text = (storage.foldername(name))[1]
      and (
        exists (
          select 1 from public.enrollments e
          where e.course_id = a.course_id
            and e.student_id = auth.uid()
        )
        or exists (
          select 1
          from public.class_members cm
          join public.class_courses cc on cc.class_id = cm.class_id
          where cm.student_id = auth.uid()
            and cm.status = 'active'
            and cc.course_id = a.course_id
        )
      )
  )
);

create policy "assignment files students read own"
on storage.objects
for select to authenticated
using (
  bucket_id = 'assignment-files'
  and owner_id = auth.uid()::text
);

create policy "assignment files staff read assigned"
on storage.objects
for select to authenticated
using (
  bucket_id = 'assignment-files'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.assignments a
      join public.courses c on c.id = a.course_id
      where a.id::text = (storage.foldername(name))[1]
        and (
          (public.current_role_name() = 'institute_admin' and c.institute_id = public.current_institute_id())
          or (public.current_role_name() = 'teacher' and exists (
            select 1 from public.course_teachers ct
            where ct.course_id = c.id and ct.teacher_id = auth.uid()
          ))
        )
    )
  )
);

create policy "assignment files students delete own"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'assignment-files'
  and owner_id = auth.uid()::text
);

create policy "rate limit events no direct access"
on public.rate_limit_events
for all to authenticated
using (false)
with check (false);

revoke execute on function public.check_rate_limit(text, text, integer, integer) from anon;
revoke execute on function public.current_institute_id() from anon;
revoke execute on function public.current_role_name() from anon;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_teacher_or_above() from anon;

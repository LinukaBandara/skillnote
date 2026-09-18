drop policy if exists "Staff manage assignments" on public.assignments;
create policy "Staff manage assignments"
on public.assignments
for all
to authenticated
using (
  is_admin()
  or exists (
    select 1 from public.courses c
    where c.id = assignments.course_id
      and (
        (current_role_name() = 'institute_admin' and c.institute_id = current_institute_id())
        or (current_role_name() = 'teacher' and exists (
          select 1 from public.course_teachers ct
          where ct.course_id = c.id and ct.teacher_id = auth.uid()
        ))
      )
  )
)
with check (
  is_admin()
  or exists (
    select 1 from public.courses c
    where c.id = assignments.course_id
      and (
        (current_role_name() = 'institute_admin' and c.institute_id = current_institute_id())
        or (current_role_name() = 'teacher' and exists (
          select 1 from public.course_teachers ct
          where ct.course_id = c.id and ct.teacher_id = auth.uid()
        ))
      )
  )
);

drop policy if exists "Staff grade submissions" on public.assignment_submissions;
create policy "Staff grade submissions"
on public.assignment_submissions
for update
to authenticated
using (
  is_admin()
  or exists (
    select 1
    from public.assignments a
    join public.courses c on c.id = a.course_id
    where a.id = assignment_submissions.assignment_id
      and (
        (current_role_name() = 'institute_admin' and c.institute_id = current_institute_id())
        or (current_role_name() = 'teacher' and exists (
          select 1 from public.course_teachers ct
          where ct.course_id = c.id and ct.teacher_id = auth.uid()
        ))
      )
  )
)
with check (
  is_admin()
  or exists (
    select 1
    from public.assignments a
    join public.courses c on c.id = a.course_id
    where a.id = assignment_submissions.assignment_id
      and (
        (current_role_name() = 'institute_admin' and c.institute_id = current_institute_id())
        or (current_role_name() = 'teacher' and exists (
          select 1 from public.course_teachers ct
          where ct.course_id = c.id and ct.teacher_id = auth.uid()
        ))
      )
  )
);

drop policy if exists "Students view own submissions, staff view all" on public.assignment_submissions;
create policy "Students view own submissions, staff view assigned"
on public.assignment_submissions
for select
to authenticated
using (
  auth.uid() = student_id
  or is_admin()
  or exists (
    select 1
    from public.assignments a
    join public.courses c on c.id = a.course_id
    where a.id = assignment_submissions.assignment_id
      and (
        (current_role_name() = 'institute_admin' and c.institute_id = current_institute_id())
        or (current_role_name() = 'teacher' and exists (
          select 1 from public.course_teachers ct
          where ct.course_id = c.id and ct.teacher_id = auth.uid()
        ))
      )
  )
);

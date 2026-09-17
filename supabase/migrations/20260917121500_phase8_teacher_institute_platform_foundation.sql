-- Phase 8: Teacher / Institute Platform foundation
-- Institute membership, classes, course-teacher assignments and class-course assignments.

create table if not exists public.institute_members (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references public.institutes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_role text not null check (membership_role in ('owner','admin','teacher','student')),
  status text not null default 'active' check (status in ('invited','active','suspended','left')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (institute_id, user_id)
);

create index if not exists idx_institute_members_user on public.institute_members(user_id);
create index if not exists idx_institute_members_institute_role on public.institute_members(institute_id, membership_role, status);

create table if not exists public.institute_classes (
  id uuid primary key default gen_random_uuid(),
  institute_id uuid not null references public.institutes(id) on delete cascade,
  name text not null,
  academic_year integer,
  stream_id uuid references public.streams(id) on delete set null,
  al_year integer check (al_year is null or al_year in (1,2,3)),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institute_id, name, academic_year)
);

create index if not exists idx_institute_classes_institute on public.institute_classes(institute_id);

create table if not exists public.class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.institute_classes(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','inactive')),
  joined_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create index if not exists idx_class_members_student on public.class_members(student_id);

create table if not exists public.course_teachers (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  assignment_role text not null default 'teacher' check (assignment_role in ('owner','teacher','assistant')),
  assigned_at timestamptz not null default now(),
  unique (course_id, teacher_id)
);

create index if not exists idx_course_teachers_teacher on public.course_teachers(teacher_id);

create table if not exists public.class_courses (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.institute_classes(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique (class_id, course_id)
);

create index if not exists idx_class_courses_course on public.class_courses(course_id);

alter table public.institute_members enable row level security;
alter table public.institute_classes enable row level security;
alter table public.class_members enable row level security;
alter table public.course_teachers enable row level security;
alter table public.class_courses enable row level security;

create policy "members can view their institute membership" on public.institute_members
for select to authenticated
using (user_id = auth.uid() or institute_id = public.current_institute_id() or public.is_admin());

create policy "institute admins manage memberships" on public.institute_members
for all to authenticated
using (public.is_admin() or (institute_id = public.current_institute_id() and public.current_role_name() in ('institute_admin','platform_admin')))
with check (public.is_admin() or (institute_id = public.current_institute_id() and public.current_role_name() in ('institute_admin','platform_admin')));

create policy "institute users view classes" on public.institute_classes
for select to authenticated
using (institute_id = public.current_institute_id() or public.is_admin());

create policy "institute admins manage classes" on public.institute_classes
for all to authenticated
using (public.is_admin() or (institute_id = public.current_institute_id() and public.current_role_name() in ('institute_admin','platform_admin')))
with check (public.is_admin() or (institute_id = public.current_institute_id() and public.current_role_name() in ('institute_admin','platform_admin')));

create policy "students and staff view class membership" on public.class_members
for select to authenticated
using (student_id = auth.uid() or exists (select 1 from public.institute_classes c where c.id = class_id and (c.institute_id = public.current_institute_id() or public.is_admin())));

create policy "institute admins manage class membership" on public.class_members
for all to authenticated
using (public.is_admin() or exists (select 1 from public.institute_classes c where c.id = class_id and c.institute_id = public.current_institute_id() and public.current_role_name() in ('institute_admin','platform_admin')))
with check (public.is_admin() or exists (select 1 from public.institute_classes c where c.id = class_id and c.institute_id = public.current_institute_id() and public.current_role_name() in ('institute_admin','platform_admin')));

create policy "teachers view assigned courses" on public.course_teachers
for select to authenticated
using (teacher_id = auth.uid() or public.is_admin() or exists (select 1 from public.courses c where c.id = course_id and c.institute_id = public.current_institute_id()));

create policy "staff manage course teachers" on public.course_teachers
for all to authenticated
using (public.is_admin() or public.is_teacher_or_above())
with check (public.is_admin() or public.is_teacher_or_above());

create policy "institute users view class courses" on public.class_courses
for select to authenticated
using (public.is_admin() or exists (select 1 from public.institute_classes c where c.id = class_id and c.institute_id = public.current_institute_id()));

create policy "institute staff manage class courses" on public.class_courses
for all to authenticated
using (public.is_admin() or (public.current_role_name() in ('teacher','institute_admin','platform_admin') and exists (select 1 from public.institute_classes c where c.id = class_id and c.institute_id = public.current_institute_id())))
with check (public.is_admin() or (public.current_role_name() in ('teacher','institute_admin','platform_admin') and exists (select 1 from public.institute_classes c where c.id = class_id and c.institute_id = public.current_institute_id())));

grant select, insert, update, delete on public.institute_members, public.institute_classes, public.class_members, public.course_teachers, public.class_courses to authenticated;

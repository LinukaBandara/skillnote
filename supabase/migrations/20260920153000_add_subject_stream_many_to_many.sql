-- Support subjects that belong to more than one A/L stream.
-- Sri Lankan Biology stream uses Biology + Chemistry + Physics,
-- while Physical Science also uses Chemistry + Physics.

create table if not exists public.subject_streams (
  subject_id uuid not null references public.subjects(id) on delete cascade,
  stream_id uuid not null references public.streams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (subject_id, stream_id)
);

alter table public.subject_streams enable row level security;

drop policy if exists "Anyone can view subject streams" on public.subject_streams;
create policy "Anyone can view subject streams"
on public.subject_streams
for select
to public
using (true);

drop policy if exists "Platform admins manage subject streams" on public.subject_streams;
create policy "Platform admins manage subject streams"
on public.subject_streams
for all
to authenticated
using ((select is_admin()))
with check ((select is_admin()));

insert into public.subject_streams (subject_id, stream_id)
select id, stream_id from public.subjects
where stream_id is not null
on conflict do nothing;

insert into public.subject_streams (subject_id, stream_id)
select s.id, st.id
from public.subjects s
cross join public.streams st
where lower(s.name) = 'biology'
  and lower(st.name) = 'physical science'
on conflict do nothing;

insert into public.subject_streams (subject_id, stream_id)
select s.id, st.id
from public.subjects s
cross join public.streams st
where lower(s.name) in ('chemistry','physics')
  and lower(st.name) = 'biological science'
on conflict do nothing;

create index if not exists idx_subject_streams_stream
  on public.subject_streams(stream_id);

create index if not exists idx_subject_streams_subject
  on public.subject_streams(subject_id);

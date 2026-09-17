-- Phase 9: Platform administration foundation
-- Central audit trail for platform and institute staff operations.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  institute_id uuid references public.institutes(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id, created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_institute on public.audit_logs(institute_id, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "platform admins view audit logs" on public.audit_logs;
create policy "platform admins view audit logs" on public.audit_logs
for select to authenticated
using (public.is_admin());

drop policy if exists "staff create audit logs" on public.audit_logs;
create policy "staff create audit logs" on public.audit_logs
for insert to authenticated
with check (actor_id = auth.uid() and (public.is_admin() or public.current_role_name() in ('institute_admin','teacher')));

grant select, insert on public.audit_logs to authenticated;

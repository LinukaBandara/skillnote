-- Phase 10: restrict direct RPC execution of privileged functions.
-- Runtime schema changes were applied to production first; this migration records them for source control.

revoke execute on function public.current_institute_id() from anon;
revoke execute on function public.current_role_name() from anon;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_teacher_or_above() from anon;

create or replace function public.create_notification(target_user uuid, n_type text, n_title text, n_body text, n_link text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text;
  v_actor_institute uuid;
  v_target_institute uuid;
begin
  if v_actor is null or target_user is null then
    raise exception 'Not authorized';
  end if;

  select role, institute_id
    into v_actor_role, v_actor_institute
  from public.profiles
  where id = v_actor;

  select institute_id
    into v_target_institute
  from public.profiles
  where id = target_user;

  if v_actor = target_user
     or v_actor_role = 'platform_admin'
     or (
       v_actor_role in ('teacher', 'institute_admin')
       and v_actor_institute is not null
       and v_actor_institute = v_target_institute
     ) then
    insert into public.notifications (user_id, type, title, body, link)
    values (target_user, n_type, n_title, n_body, n_link);
  else
    raise exception 'Not authorized';
  end if;
end;
$$;

revoke execute on function public.create_notification(uuid, text, text, text, text) from anon;
grant execute on function public.create_notification(uuid, text, text, text, text) to authenticated;

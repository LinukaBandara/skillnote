drop policy if exists "Staff manage languages" on public.content_languages;
create policy "Platform admins manage languages" on public.content_languages for all to authenticated using (is_admin()) with check (is_admin());

create or replace function public.set_translation_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_question_translations_updated_at on public.question_translations;
create trigger trg_question_translations_updated_at
before update on public.question_translations
for each row execute function public.set_translation_updated_at();

revoke all on function public.set_translation_updated_at() from anon, authenticated;

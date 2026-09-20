-- Phase performance: evaluate auth.uid() once per statement in RLS policies.
do $$
declare
  r record;
  using_expr text;
  check_expr text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') like '%auth.uid()%'
        or coalesce(with_check, '') like '%auth.uid()%'
      )
  loop
    using_expr := case
      when r.qual is null then null
      else replace(r.qual, 'auth.uid()', '(select auth.uid())')
    end;

    check_expr := case
      when r.with_check is null then null
      else replace(r.with_check, 'auth.uid()', '(select auth.uid())')
    end;

    if using_expr is not null and check_expr is not null then
      execute format(
        'alter policy %I on %I.%I using (%s) with check (%s)',
        r.policyname, r.schemaname, r.tablename, using_expr, check_expr
      );
    elsif using_expr is not null then
      execute format(
        'alter policy %I on %I.%I using (%s)',
        r.policyname, r.schemaname, r.tablename, using_expr
      );
    elsif check_expr is not null then
      execute format(
        'alter policy %I on %I.%I with check (%s)',
        r.policyname, r.schemaname, r.tablename, check_expr
      );
    end if;
  end loop;
end
$$;

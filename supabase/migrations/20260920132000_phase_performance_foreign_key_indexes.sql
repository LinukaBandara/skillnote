-- Phase performance: index every public foreign-key column not already covered.
-- Keeps joins, RLS relationship checks, and delete/update checks scalable.
do $$
declare
  r record;
  index_name text;
begin
  for r in
    select
      n.nspname as schema_name,
      cl.relname as table_name,
      string_agg(format('%I', a.attname), ', ' order by u.ord) as columns,
      string_agg(a.attname, '_' order by u.ord) as column_suffix
    from pg_constraint c
    join pg_class cl on cl.oid = c.conrelid
    join pg_namespace n on n.oid = cl.relnamespace
    cross join lateral unnest(c.conkey) with ordinality u(attnum, ord)
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = u.attnum
    where c.contype = 'f'
      and n.nspname = 'public'
      and not exists (
        select 1
        from pg_index i
        where i.indrelid = c.conrelid
          and i.indisvalid
          and i.indisready
          and i.indnkeyatts >= cardinality(c.conkey)
          and (
            select array_agg(x order by ord)
            from unnest(i.indkey[0:cardinality(c.conkey)-1]) with ordinality z(x, ord)
          ) = (
            select array_agg(x order by ord)
            from unnest(c.conkey) with ordinality z(x, ord)
          )
      )
    group by n.nspname, cl.relname
  loop
    index_name := left(
      'idx_' || r.table_name || '_' || r.column_suffix || '_fk',
      63
    );

    execute format(
      'create index if not exists %I on %I.%I (%s)',
      index_name,
      r.schema_name,
      r.table_name,
      r.columns
    );
  end loop;
end
$$;

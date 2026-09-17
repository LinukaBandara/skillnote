create table if not exists public.learning_outcome_mastery (
  student_id uuid not null references auth.users(id) on delete cascade,
  learning_outcome_id uuid not null references public.syllabus_learning_outcomes(id) on delete cascade,
  attempts integer not null default 0 check (attempts >= 0),
  correct integer not null default 0 check (correct >= 0),
  recent_attempts integer not null default 0 check (recent_attempts >= 0),
  recent_correct integer not null default 0 check (recent_correct >= 0),
  mastery integer not null default 0 check (mastery between 0 and 100),
  avg_time_seconds numeric(10,2),
  last_practiced_at timestamptz,
  interval_days integer not null default 1 check (interval_days > 0),
  due_at timestamptz not null default now(),
  stage text not null default 'new' check (stage in ('new','learning','developing','mastered','review')),
  updated_at timestamptz not null default now(),
  primary key (student_id, learning_outcome_id)
);

create table if not exists public.practice_recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  learning_outcome_id uuid references public.syllabus_learning_outcomes(id) on delete cascade,
  topic_id uuid references public.syllabus_topics(id) on delete cascade,
  recommendation_type text not null check (recommendation_type in ('learn','practice','review','mock','revision')),
  priority numeric(6,3) not null default 0,
  reason text not null,
  target_count integer not null default 5 check (target_count > 0),
  completed_count integer not null default 0 check (completed_count >= 0),
  scheduled_for date,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_learning_outcome_mastery_student_due on public.learning_outcome_mastery(student_id, due_at);
create index if not exists idx_learning_outcome_mastery_outcome on public.learning_outcome_mastery(learning_outcome_id);
create index if not exists idx_practice_recommendations_student_active on public.practice_recommendations(student_id, completed_at, priority desc);
create index if not exists idx_practice_recommendations_outcome on public.practice_recommendations(learning_outcome_id);

alter table public.learning_outcome_mastery enable row level security;
alter table public.practice_recommendations enable row level security;

create policy "Students read own outcome mastery" on public.learning_outcome_mastery for select to authenticated using ((select auth.uid()) = student_id or is_teacher_or_above());
create policy "Students manage own outcome mastery" on public.learning_outcome_mastery for all to authenticated using ((select auth.uid()) = student_id or is_teacher_or_above()) with check ((select auth.uid()) = student_id or is_teacher_or_above());
create policy "Students read own recommendations" on public.practice_recommendations for select to authenticated using ((select auth.uid()) = student_id or is_teacher_or_above());
create policy "Students manage own recommendations" on public.practice_recommendations for all to authenticated using ((select auth.uid()) = student_id or is_teacher_or_above()) with check ((select auth.uid()) = student_id or is_teacher_or_above());

grant select, insert, update, delete on public.learning_outcome_mastery, public.practice_recommendations to authenticated;

create or replace function public.refresh_learning_outcome_mastery(p_student_id uuid, p_learning_outcome_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare v_attempts integer; v_correct integer; v_recent_attempts integer; v_recent_correct integer; v_avg_time numeric; v_mastery integer; v_stage text; v_interval integer; v_due timestamptz;
begin
  if auth.uid() is null or (auth.uid() <> p_student_id and not is_teacher_or_above()) then raise exception 'not authorized'; end if;
  select count(*)::integer, count(*) filter (where qa.is_correct)::integer, avg(qa.time_taken_seconds)::numeric(10,2) into v_attempts, v_correct, v_avg_time from public.question_attempts qa join public.questions q on q.id=qa.question_id where qa.student_id=p_student_id and q.learning_outcome_id=p_learning_outcome_id;
  select count(*)::integer, count(*) filter (where qa.is_correct)::integer into v_recent_attempts, v_recent_correct from (select qa.is_correct from public.question_attempts qa join public.questions q on q.id=qa.question_id where qa.student_id=p_student_id and q.learning_outcome_id=p_learning_outcome_id order by qa.attempted_at desc limit 10) qa;
  if v_attempts=0 then v_mastery:=0; v_stage:='new'; v_interval:=1; else v_mastery:=greatest(0,least(100,round((0.4*(v_correct::numeric/v_attempts)+0.6*(v_recent_correct::numeric/greatest(v_recent_attempts,1)))*100)::integer)); v_stage:=case when v_mastery>=85 and v_recent_attempts>=5 then 'mastered' when v_mastery>=65 then 'developing' when v_mastery>=35 then 'learning' else 'review' end; v_interval:=case when v_mastery>=85 then 14 when v_mastery>=65 then 7 when v_mastery>=35 then 3 else 1 end; end if;
  v_due:=coalesce((select last_practiced_at from public.learning_outcome_mastery where student_id=p_student_id and learning_outcome_id=p_learning_outcome_id),now())+make_interval(days=>v_interval);
  insert into public.learning_outcome_mastery(student_id,learning_outcome_id,attempts,correct,recent_attempts,recent_correct,mastery,avg_time_seconds,last_practiced_at,interval_days,due_at,stage,updated_at) values(p_student_id,p_learning_outcome_id,v_attempts,v_correct,v_recent_attempts,v_recent_correct,v_mastery,v_avg_time,case when v_attempts>0 then now() else null end,v_interval,case when v_attempts>0 then v_due else now() end,v_stage,now()) on conflict(student_id,learning_outcome_id) do update set attempts=excluded.attempts,correct=excluded.correct,recent_attempts=excluded.recent_attempts,recent_correct=excluded.recent_correct,mastery=excluded.mastery,avg_time_seconds=excluded.avg_time_seconds,last_practiced_at=excluded.last_practiced_at,interval_days=excluded.interval_days,due_at=excluded.due_at,stage=excluded.stage,updated_at=now();
end; $$;
revoke execute on function public.refresh_learning_outcome_mastery(uuid,uuid) from anon;
grant execute on function public.refresh_learning_outcome_mastery(uuid,uuid) to authenticated;

create or replace function public.refresh_practice_recommendations(p_student_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null or (auth.uid() <> p_student_id and not is_teacher_or_above()) then raise exception 'not authorized'; end if;
  delete from public.practice_recommendations where student_id=p_student_id and completed_at is null and expires_at is not null and expires_at < now();
  insert into public.practice_recommendations(student_id,learning_outcome_id,topic_id,recommendation_type,priority,reason,target_count,scheduled_for,expires_at)
  select p_student_id,lom.learning_outcome_id,slo.topic_id,case when lom.mastery<35 then 'practice' when lom.due_at<=now() then 'review' else 'practice' end,(100-lom.mastery)+case when lom.due_at<=now() then 25 else 0 end+case when lom.recent_attempts>0 and lom.recent_correct::numeric/lom.recent_attempts<0.5 then 20 else 0 end,case when lom.mastery<35 then 'Low mastery — focused practice recommended.' when lom.due_at<=now() then 'Due for spaced revision.' else 'Recent performance suggests more practice.' end,case when lom.mastery<35 then 8 when lom.mastery<65 then 5 else 3 end,current_date,now()+interval '3 days'
  from public.learning_outcome_mastery lom join public.syllabus_learning_outcomes slo on slo.id=lom.learning_outcome_id where lom.student_id=p_student_id and (lom.mastery<85 or lom.due_at<=now()) and not exists(select 1 from public.practice_recommendations pr where pr.student_id=p_student_id and pr.learning_outcome_id=lom.learning_outcome_id and pr.completed_at is null and (pr.expires_at is null or pr.expires_at>=now()));
end; $$;
revoke execute on function public.refresh_practice_recommendations(uuid) from anon;
grant execute on function public.refresh_practice_recommendations(uuid) to authenticated;

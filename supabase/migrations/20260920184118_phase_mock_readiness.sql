create or replace function public.get_mock_readiness(p_student_id uuid)
returns table (
  readiness_score integer,
  coverage_percent integer,
  mastery_percent integer,
  recent_accuracy_percent integer,
  revision_percent integer,
  total_outcomes integer,
  attempted_outcomes integer,
  mastered_outcomes integer,
  developing_outcomes integer,
  review_outcomes integer,
  due_outcomes integer,
  recent_attempts integer,
  recent_correct integer,
  recent_mock_score integer,
  recent_mock_count integer,
  readiness_state text,
  headline text,
  guidance text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_total integer := 0;
  v_attempted integer := 0;
  v_mastered integer := 0;
  v_developing integer := 0;
  v_review integer := 0;
  v_due integer := 0;
  v_mastery integer := 0;
  v_coverage integer := 0;
  v_recent_attempts integer := 0;
  v_recent_correct integer := 0;
  v_recent_accuracy integer := 0;
  v_revision integer := 0;
  v_score integer := 0;
  v_mock_score integer;
  v_mock_count integer := 0;
  v_state text;
  v_headline text;
  v_guidance text;
begin
  if auth.uid() is null
     or (auth.uid() <> p_student_id and not is_teacher_or_above()) then
    raise exception 'not authorized';
  end if;

  with expected as (
    select distinct slo.id
    from public.student_subjects ss
    join public.syllabus_units su on su.subject_id = ss.subject_id
    join public.syllabus_topics st on st.unit_id = su.id
    join public.syllabus_subtopics sst on sst.topic_id = st.id
    join public.syllabus_learning_outcomes slo on slo.subtopic_id = sst.id
    where ss.student_id = p_student_id
  )
  select
    count(*)::integer,
    count(lom.learning_outcome_id)::integer,
    count(*) filter (where lom.mastery >= 85)::integer,
    count(*) filter (where lom.mastery >= 35 and lom.mastery < 85)::integer,
    count(*) filter (where lom.mastery < 35)::integer,
    count(*) filter (where lom.learning_outcome_id is not null and lom.due_at <= now())::integer,
    coalesce(round(avg(lom.mastery) filter (where lom.learning_outcome_id is not null))::integer, 0)
  into v_total, v_attempted, v_mastered, v_developing, v_review, v_due, v_mastery
  from expected e
  left join public.learning_outcome_mastery lom
    on lom.learning_outcome_id = e.id
   and lom.student_id = p_student_id;

  if v_total = 0 then
    select count(*)::integer,
           count(*) filter (where mastery >= 85)::integer,
           count(*) filter (where mastery >= 35 and mastery < 85)::integer,
           count(*) filter (where mastery < 35)::integer,
           count(*) filter (where due_at <= now())::integer,
           coalesce(round(avg(mastery))::integer, 0)
      into v_attempted, v_mastered, v_developing, v_review, v_due, v_mastery
    from public.learning_outcome_mastery
    where student_id = p_student_id;

    v_total := v_attempted;
  end if;

  v_coverage := case when v_total > 0 then least(100, round(v_attempted::numeric * 100 / v_total)::integer) else 0 end;

  with recent as (
    select qa.is_correct
    from public.question_attempts qa
    where qa.student_id = p_student_id
    order by qa.attempted_at desc
    limit 20
  )
  select count(*)::integer, count(*) filter (where is_correct)::integer
    into v_recent_attempts, v_recent_correct
  from recent;

  v_recent_accuracy := case
    when v_recent_attempts > 0
      then round(v_recent_correct::numeric * 100 / v_recent_attempts)::integer
    else 0
  end;

  v_revision := case
    when v_attempted > 0
      then greatest(0, least(100, round((v_attempted - v_due)::numeric * 100 / v_attempted)::integer))
    else 0
  end;

  v_score := least(100, greatest(0,
    round(
      v_coverage * 0.25
      + v_mastery * 0.40
      + v_recent_accuracy * 0.20
      + v_revision * 0.15
    )::integer
  ));

  select
    round(avg(score))::integer,
    count(*)::integer
  into v_mock_score, v_mock_count
  from (
    select mea.score
    from public.mock_exam_attempts mea
    where mea.student_id = p_student_id
      and mea.submitted_at is not null
    order by mea.submitted_at desc
    limit 3
  ) recent_mocks;

  v_state := case
    when v_attempted = 0 then 'starting'
    when v_score >= 80 then 'ready'
    when v_score >= 60 then 'nearly_ready'
    when v_score >= 40 then 'building'
    else 'needs_revision'
  end;

  v_headline := case v_state
    when 'ready' then 'You have a strong base for a mock.'
    when 'nearly_ready' then 'You are close to mock-ready.'
    when 'building' then 'Build a little more coverage before your next mock.'
    when 'needs_revision' then 'Strengthen weak and overdue outcomes first.'
    else 'Start with focused practice to build your readiness.'
  end;

  v_guidance := case
    when v_attempted = 0 then 'Complete your first set of practice questions. Skill Note will use the results to build your readiness profile.'
    when v_due > 0 then format('Review %s due outcome%s, then complete a short practice set.', v_due, case when v_due = 1 then '' else 's' end)
    when v_review > 0 then format('Focus on %s outcome%s below 35%% mastery before attempting a full mock.', v_review, case when v_review = 1 then '' else 's' end)
    when v_coverage < 70 then 'Keep practising new outcomes so your readiness reflects more of the syllabus.'
    else 'Maintain your current practice rhythm and use a mock to validate your readiness.'
  end;

  return query
  select
    v_score,
    v_coverage,
    v_mastery,
    v_recent_accuracy,
    v_revision,
    v_total,
    v_attempted,
    v_mastered,
    v_developing,
    v_review,
    v_due,
    v_recent_attempts,
    v_recent_correct,
    v_mock_score,
    v_mock_count,
    v_state,
    v_headline,
    v_guidance;
end;
$$;

revoke execute on function public.get_mock_readiness(uuid) from anon;
grant execute on function public.get_mock_readiness(uuid) to authenticated;

create or replace function public.get_adaptive_practice_questions(
  p_student_id uuid,
  p_subject_id uuid,
  p_limit integer default 20
)
returns table(question_id uuid, score numeric)
language sql
security invoker
set search_path = public
as $$
  with candidate_questions as (
    select
      q.id,
      q.learning_outcome_id,
      q.difficulty,
      coalesce(lom.mastery, 0) as mastery,
      coalesce(lom.due_at, now()) as due_at,
      coalesce(lom.recent_attempts, 0) as recent_attempts,
      coalesce(lom.recent_correct, 0) as recent_correct,
      case
        when q.difficulty = 'easy' and coalesce(lom.mastery, 0) < 50 then 18
        when q.difficulty = 'medium' and coalesce(lom.mastery, 0) between 40 and 80 then 20
        when q.difficulty = 'hard' and coalesce(lom.mastery, 0) >= 70 then 18
        else 6
      end as difficulty_fit,
      case when qa.question_id is null then 22 else 0 end as unseen_bonus,
      case when coalesce(lom.due_at, now()) <= now() then 25 else 0 end as due_bonus,
      case
        when coalesce(lom.recent_attempts, 0) > 0
         and (lom.recent_correct::numeric / greatest(lom.recent_attempts, 1)) < 0.5
        then 24 else 0
      end as weak_recent_bonus
    from public.questions q
    left join public.learning_outcome_mastery lom
      on lom.learning_outcome_id = q.learning_outcome_id
     and lom.student_id = p_student_id
    left join lateral (
      select qa.question_id
      from public.question_attempts qa
      where qa.student_id = p_student_id
        and qa.question_id = q.id
      limit 1
    ) qa on true
    where q.subject_id = p_subject_id
      and q.review_status = 'PUBLISHED'
      and q.question_type in ('mcq', 'true_false')
      and q.correct_index is not null
  )
  select id as question_id,
    (100 - mastery) + difficulty_fit + unseen_bonus + due_bonus + weak_recent_bonus + random() * 8 as score
  from candidate_questions
  order by score desc
  limit greatest(1, least(p_limit, 50));
$$;

revoke execute on function public.get_adaptive_practice_questions(uuid,uuid,integer) from anon;
grant execute on function public.get_adaptive_practice_questions(uuid,uuid,integer) to authenticated;

create index if not exists idx_questions_adaptive_subject_status
  on public.questions(subject_id, review_status, question_type, difficulty);

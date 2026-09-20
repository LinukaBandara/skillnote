-- Biology Units 4-6 curriculum seed (NIE GCE A/L 2017)
-- Replays the verified live hierarchy for competencies, competency levels and outcomes.
with v as (select id from public.syllabus_versions where code='GCE_AL_2017'), bio as (select id from public.subjects where name='Biology')
insert into public.syllabus_competencies(syllabus_version_id,subject_id,code,title,description,position)
select v.id,bio.id,x.code,x.title,x.description,x.position from v cross join bio cross join (values
) x(code,title,description,position)
where not exists(select 1 from public.syllabus_competencies c where c.syllabus_version_id=v.id and c.subject_id=bio.id and c.code=x.code);

with v as (select id from public.syllabus_versions where code='GCE_AL_2017'), bio as (select id from public.subjects where name='Biology')
insert into public.syllabus_competency_levels(competency_id,syllabus_version_id,subject_id,code,title,description,position)
select c.id,v.id,bio.id,x.code,x.title,x.description,x.position from v cross join bio cross join (values
) x(code,competency_code,title,description,position)
join public.syllabus_competencies c on c.syllabus_version_id=v.id and c.subject_id=bio.id and c.code=x.competency_code
where not exists(select 1 from public.syllabus_competency_levels cl where cl.syllabus_version_id=v.id and cl.subject_id=bio.id and cl.code=x.code);

-- The application seed maps each competency level to an existing/new topic and a core subtopic.
with cl as (select * from public.syllabus_competency_levels where syllabus_version_id=(select id from public.syllabus_versions where code='GCE_AL_2017') and subject_id=(select id from public.subjects where name='Biology') and code like any(array['4.%','5.%','6.%']))
insert into public.syllabus_topics(unit_id,title,position)
select u.id,cl.code || ' — ' || cl.title,100+cl.position from cl join public.syllabus_units u on u.subject_id=cl.subject_id and u.syllabus_version_id=cl.syllabus_version_id and u.position=case when cl.code like '4.%' then 4 when cl.code like '5.%' then 5 else 6 end where not exists(select 1 from public.syllabus_topics t where t.unit_id=u.id and t.title=cl.code || ' — ' || cl.title);
with cl as (select * from public.syllabus_competency_levels where syllabus_version_id=(select id from public.syllabus_versions where code='GCE_AL_2017') and subject_id=(select id from public.subjects where name='Biology') and code like any(array['4.%','5.%','6.%']))
insert into public.syllabus_subtopics(topic_id,title,description,position)
select t.id,'Core learning outcomes','Official NIE 2017 Biology competency-level learning area.',1 from cl join public.syllabus_topics t on t.title=cl.code || ' — ' || cl.title where not exists(select 1 from public.syllabus_subtopics st where st.topic_id=t.id and st.title='Core learning outcomes');

with o(level_code,statement,position) as (values
)
insert into public.syllabus_learning_outcomes(subtopic_id,competency_id,competency_level_id,statement,position)
select st.id,cl.competency_id,cl.id,o.statement,o.position from o join public.syllabus_competency_levels cl on cl.code=o.level_code and cl.syllabus_version_id=(select id from public.syllabus_versions where code='GCE_AL_2017') and cl.subject_id=(select id from public.subjects where name='Biology') join public.syllabus_subtopics st on st.title='Core learning outcomes' join public.syllabus_topics t on t.id=st.topic_id and t.title=cl.code || ' — ' || cl.title where not exists(select 1 from public.syllabus_learning_outcomes lo where lo.subtopic_id=st.id and lo.statement=o.statement);

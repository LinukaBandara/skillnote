-- G.C.E. A/L Biological Science uses Biology, Chemistry and Physics.
delete from public.subject_streams ss
using public.subjects s, public.streams st
where ss.subject_id=s.id
  and ss.stream_id=st.id
  and s.name='Biology'
  and st.name='Physical Science';

insert into public.subject_streams(subject_id,stream_id)
select s.id, st.id
from public.subjects s
cross join public.streams st
where s.name in ('Biology','Chemistry','Physics')
  and st.name='Biological Science'
on conflict do nothing;

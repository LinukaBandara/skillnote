-- Chemistry and Physics are shared by Sri Lankan Biological Science and Physical Science streams.
insert into public.subject_streams(subject_id,stream_id)
select s.id,st.id
from public.subjects s
cross join public.streams st
where s.name in ('Chemistry','Physics')
  and st.name='Biological Science'
on conflict do nothing;

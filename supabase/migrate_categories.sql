-- 투데이트: 서버에 저장된 일정을 지금 카테고리 구조로 한 번에 옮기기
-- Supabase SQL Editor 에서 실행. 여러 번 실행해도 결과가 같음(이미 옮긴 일정은 건드리지 않음).
-- 앱은 열 때마다 기기 안에서 같은 변환을 하지만, 서버 데이터는 일정을 다시 저장하기 전까지 예전 형식으로 남아 있어서 이 파일로 맞춤.
--
-- 바뀐 내용
--   1) 아주 예전 형식(sub 없음): 여행·맛집·약속·기타·기념일 → 데이트/개인 구조
--   2) 데이트 › 운동            → 데이트 › 활동 › 운동
--   3) 데이트 › 집중(독서·공부)  → 데이트 › 휴식 › 독서·공부  (과제·생산·세부 없음은 휴식으로)
--   4) 개인 › 경호               → 호 › 업무
--   5) 개인 › 👩 일정·공부        → 솔 › 👩 일정·공부
--   (출장 → 업무, 개인 → 호, 집 → 휴식 처럼 이름만 바뀐 것은 저장 값이 같아서 옮길 필요 없음)

-- 먼저 옮길 일정이 몇 개인지 보기 (이 부분만 실행해도 됨)
select '1) 예전 형식'              as 변경, count(*) from public.twodate_events where not (data ? 'sub')
union all select '2) 데이트 › 운동',         count(*) from public.twodate_events where data->>'cat' = 'date'     and data->>'sub' = 'sport'
union all select '3) 데이트 › 집중',         count(*) from public.twodate_events where data->>'cat' = 'date'     and data->>'sub' = 'study'
union all select '4) 개인 › 경호',           count(*) from public.twodate_events where data->>'cat' = 'personal' and data->>'sub' = 'guard'
union all select '5) 개인 › 👩 일정·공부',    count(*) from public.twodate_events where data->>'cat' = 'personal' and data->>'sub' in ('meet', 'study');

begin;

-- 1) 아주 예전 형식. 약속은 개인 › 일정으로 옮긴 뒤 5)에서 솔로 감
update public.twodate_events
set data = (data - 'catLabel') || (case data->>'cat'
      when 'trip' then '{"cat":"date","sub":"walk","sub2":"여행"}'
      when 'food' then '{"cat":"date","sub":"food","sub2":""}'
      when 'meet' then '{"cat":"personal","sub":"meet","sub2":""}'
      when 'etc'  then '{"cat":"date","sub":"etc","sub2":""}'
      else             '{"cat":"date","sub":"","sub2":""}'
    end)::jsonb,
    updated_at = now()
where not (data ? 'sub');

-- 2) 데이트 › 운동 → 활동 › 운동
update public.twodate_events
set data = data || '{"sub":"etc","sub2":"운동"}'::jsonb, updated_at = now()
where data->>'cat' = 'date' and data->>'sub' = 'sport';

-- 3) 데이트 › 집중 → 휴식 (독서·공부는 세부 항목으로 남김)
update public.twodate_events
set data = data || jsonb_build_object('sub', 'home',
                                      'sub2', case when data->>'sub2' in ('독서', '공부') then data->>'sub2' else '' end),
    updated_at = now()
where data->>'cat' = 'date' and data->>'sub' = 'study';

-- 4) 개인 › 경호 → 업무
update public.twodate_events
set data = data || '{"sub":"work"}'::jsonb, updated_at = now()
where data->>'cat' = 'personal' and data->>'sub' = 'guard';

-- 5) 개인 › 👩 일정·공부 → 솔
update public.twodate_events
set data = data || '{"cat":"sol"}'::jsonb, updated_at = now()
where data->>'cat' = 'personal' and data->>'sub' in ('meet', 'study');

commit;

-- 결과 확인: 카테고리별 일정 수
select data->>'cat' as 카테고리, data->>'sub' as 하위, count(*) as 일정수
from public.twodate_events group by 1, 2 order by 1, 2;

---
description: 리텐션 테스트 데일리 리포트 — 누적 가입자(=초대한 사람) 전원의 가입 후 N일째·재방문·2회차·초대 현황을 집계해 보고
---

# 리텐션 테스트 데일리 리포트 (롤링 / 가입 후 N일째)

잇다 리텐션 테스트의 현황을 집계해서 한국어로 보고한다. 매일 자정(KST) 예약 트리거로 실행되거나,
창업자가 수동으로 호출한다.

**코호트 = 가입한 실사용자 전원(누적).** 창업자가 한 명씩 알음알음 초대하고 있으므로,
**가입한 사람 = 초대한 사람**으로 본다. 고정된 "테스트 시작일"로 묶지 않는다. 대신 **사람마다
"가입 후 N일째"** 로 보고, "가입 다음 날 이후 다시 왔나(재방문)"를 핵심 신호로 읽는다.

**명단 입력은 필요 없다.** 가입 시 입력한 이름·이메일이 트리거(`handle_new_user`)로
`public.profiles`에 자동 저장된다. `@itda.net` 내부 계정만 제외한다.

## 절차

1. **SQL 실행**: Supabase MCP `execute_sql`(project_id: `zugwccngzprjjnwtajyr`)로 아래 쿼리를 실행한다.

```sql
with people as (
  select p.id as user_id, p.name, coalesce(p.auth_provider,'email') as provider,
         p.email, p.created_at as signed_up_at
  from public.profiles p
  where p.email not ilike '%@itda.net'          -- 내부 계정만 제외
),
activity as (
  select user_id, created_at from public.app_events
  union all select user_id, created_at from public.care_logs
  union all select user_id, created_at from public.daily_answers
  union all select user_id, created_at from public.diary_entries
  union all select user_id, created_at from public.community_posts
)
select
  pe.name  as 이름,
  pe.email as 이메일,
  pe.provider as 가입수단,
  (pe.signed_up_at at time zone 'Asia/Seoul')::date as 가입일,
  floor(extract(epoch from (now() - pe.signed_up_at))/86400)::int as 가입후N일,
  (select count(*) from public.app_events e where e.user_id = pe.user_id) as 페이지뷰,
  (select max(a.created_at) from activity a where a.user_id = pe.user_id) as 마지막활동,
  (select count(distinct (a.created_at at time zone 'Asia/Seoul')::date)
     from activity a where a.user_id = pe.user_id) as 활동일수,
  -- 재방문 = 가입한 날보다 뒤의 날에 활동 기록이 있으면 Y (D1+ 리텐션)
  case when exists (
     select 1 from activity a where a.user_id = pe.user_id
       and (a.created_at at time zone 'Asia/Seoul')::date
         > (pe.signed_up_at at time zone 'Asia/Seoul')::date
  ) then 'Y' else 'N' end as 재방문,
  -- 2회차 행동 = 쓰기(일지·답변·일기·글) 중 하나라도 2회 이상
  case when
       (select count(*) from public.care_logs       where user_id = pe.user_id) >= 2
    or (select count(*) from public.daily_answers   where user_id = pe.user_id) >= 2
    or (select count(*) from public.diary_entries   where user_id = pe.user_id) >= 2
    or (select count(*) from public.community_posts where user_id = pe.user_id) >= 2
    then 'Y' else 'N' end as 두번째행동,
  (select count(*) from public.care_members m
     where m.invited_by = pe.user_id and m.user_id is distinct from pe.user_id) as 초대보냄,
  (select count(*) from public.care_members m
     where m.invited_by = pe.user_id and m.user_id is distinct from pe.user_id
       and m.accepted_at is not null)
   + (select count(*) from public.friend_invites fi
        where fi.inviter_id = pe.user_id and fi.accepted_at is not null) as 초대수락,
  case when exists (
     select 1 from public.care_subjects s
     join public.care_members m on m.subject_id = s.id
     where s.user_id = pe.user_id and m.user_id is distinct from pe.user_id
  ) then '함께' else '혼자' end as 혼자vs함께
from people pe
order by pe.signed_up_at desc;        -- 최근 가입이 맨 위
```

2. **리포트 작성** (한국어, 잇다 톤 — 과장·이모지 남발 금지). 다음을 포함:

   - **한 줄 요약**: 누적 가입(=초대) N명 / 재방문(D1+) M명 / 2회차 도달 K명 / 오늘 신규 가입 N명.
     (가입한 사람 = 초대한 사람이므로 "초대 대비 전환율"은 따로 계산하지 않는다.
     초대했지만 가입 안 한 사람은 데이터에 잡히지 않는다 — 그건 창업자가 머릿속으로만 안다.)

   - **지난 24시간**: 오늘/어제 신규 가입 N명(이름), 어제 활동한 기존 가입자 N명, 새 초대 수락 N건.

   - **가입 후 N일째 코호트 뷰** (핵심): 사람을 "가입후N일" 구간으로 묶어 본다.
     - Day 0 (오늘 가입): 첫인상 — 몇 페이지 보고 나갔나.
     - Day 1~3: **가장 중요** — 다음 날 다시 왔나(재방문 Y/N).
     - Day 7+: 오래된 가입자 — 아직도 오나, 아니면 한 번 보고 끝났나.

   - **LQ 신호**:
     - LQ1(다시 오나) = 재방문(D1+) 비율. 어느 기능에서 2회차가 나왔는지.
     - LQ2(함께 쓰나) = 초대 보냄·수락 + "함께" 사용자 수.

   - **주의 신호**: 가입했지만 재방문 N이고 활동일수 0~1인 사람(이탈) 이름 나열.
     특히 **Day 2 이상인데 재방문 N** = 사실상 이탈로 본다.

   - **데이터 품질 주의**: 표에 **운영자 본인 계정·Admin·중복 이름**이 섞여 있으면
     한 줄로 분리해 표시하고(예: "단청은 운영자 계정으로 추정 — 테스터 분모에서 제외 권장"),
     순수 테스터 수를 따로 적는다. 창업자가 확정해주면 그 다음부터 SQL에서 제외한다.

   - 마지막에 전체 표(이름·이메일 포함)를 붙인다.
   - 표본이 작으면(테스터 5명 미만) "표본이 작아 추세 해석은 이르다. 신호만 기록"이라고 명시.

3. 리포트만 출력한다. 파일 수정·커밋은 하지 않는다(읽기 전용 보고).

## 참고
- **명단 파일은 쓰지 않는다.** 가입 = 자동 추적 = 초대한 사람.
- **페이지뷰(`app_events`)는 2026-06-05 배포 이후부터만 기록.** 그 전 가입자는 페이지뷰 0으로
  보여도 "측정 안 됨"이지 "방문 안 함"이 아니다. 재방문 판정은 쓰기 활동까지 합쳐서 본다.
- 쓰기 행동(일지·답변·일기·글·초대)은 과거치 포함 전부 집계됨.
- 측정 설계 배경: `docs/interview-guide.md`(LQ1·LQ2), `docs/strategy.md` 5절(가설③).

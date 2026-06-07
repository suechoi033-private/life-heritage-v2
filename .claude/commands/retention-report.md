---
description: 리텐션 테스트 데일리 리포트 — 가입자(자동)의 재방문·2회차·초대 현황을 집계해 보고
---

# 리텐션 테스트 데일리 리포트

잇다 리텐션 테스트의 현재 현황을 집계해서 한국어로 보고한다. 매일 자정(KST) 예약 트리거로 실행되거나, 창업자가 수동으로 호출한다.

**명단 입력은 필요 없다.** 가입 시 입력한 이름·이메일이 트리거(`handle_new_user`)로
`public.profiles`에 자동 저장되므로, "테스트 시작일 이후 가입자"를 코호트로 자동 집계한다.

## 절차

1. **테스트 시작일 확인**: 아래 SQL의 `test_start` 값이 실제 테스트 시작일(KST, 초대를 보낸 날)인지
   본다. 창업자가 날짜를 알려주면 그 값으로 바꿔 실행한다. (기본값이 미래/과거로 어긋나 있으면
   현재 가입 데이터를 보고 합리적인 시작일로 맞추고, 어떤 날짜를 썼는지 리포트에 한 줄 명시한다.)

2. **SQL 실행**: Supabase MCP `execute_sql`(project_id: `zugwccngzprjjnwtajyr`)로 아래 쿼리를 실행한다.
   `docs/retention-test-report.sql`과 동일한 자동 코호트 로직이다.

```sql
with params as (
  select timestamptz '2026-06-08 00:00:00+09' as test_start   -- ← 테스트 시작일(KST)
),
people as (
  select p.id as user_id, p.name, p.email, p.auth_provider, p.created_at as signed_up_at
  from public.profiles p, params
  where p.created_at >= params.test_start
    and p.email not ilike '%@itda.net'
)
select
  pe.name as 이름, pe.email as 이메일, coalesce(pe.auth_provider,'email') as 가입수단,
  pe.signed_up_at as 가입시각,
  (pe.signed_up_at > now() - interval '24 hours') as 어제가입,
  (select count(*) from public.app_events e where e.user_id = pe.user_id) as 페이지뷰누적,
  (select count(*) from public.app_events e where e.user_id = pe.user_id
     and e.created_at > now() - interval '24 hours') as 페이지뷰24h,
  (select max(created_at) from public.app_events e where e.user_id = pe.user_id) as 마지막방문,
  (select count(distinct d) from (
      select date_trunc('day', created_at) d from public.app_events     where user_id = pe.user_id
      union all select date_trunc('day', created_at) from public.care_logs       where user_id = pe.user_id
      union all select date_trunc('day', created_at) from public.daily_answers   where user_id = pe.user_id
      union all select date_trunc('day', created_at) from public.diary_entries   where user_id = pe.user_id
      union all select date_trunc('day', created_at) from public.community_posts where user_id = pe.user_id
   ) x) as 활동일수,
  (select count(*) from public.care_logs       c  where c.user_id  = pe.user_id) as 케어일지,
  (select count(*) from public.daily_answers   a  where a.user_id  = pe.user_id) as 질문답변,
  (select count(*) from public.diary_entries   d2 where d2.user_id = pe.user_id) as 일기,
  (select count(*) from public.community_posts cp where cp.user_id = pe.user_id) as 커뮤글,
  case when
       (select count(*) from public.care_logs       where user_id = pe.user_id) >= 2
    or (select count(*) from public.daily_answers   where user_id = pe.user_id) >= 2
    or (select count(*) from public.diary_entries   where user_id = pe.user_id) >= 2
    or (select count(*) from public.community_posts where user_id = pe.user_id) >= 2
    then 'Y' else 'N' end as "2회차도달",
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
  ) then '함께' else '혼자' end as "혼자vs함께"
from people pe
order by pe.signed_up_at;
```

3. **리포트 작성** (한국어, 잇다 톤 — 과장·이모지 남발 금지). 다음을 포함:
   - **한 줄 요약**: 직접 초대 26명 → 가입 N명(전환율 N%) / 2회차 도달 N명 / 초대 보낸 사람 N명.
     (사용한 test_start 날짜 명시. 직접 초대 분모는 26명 — 추천으로 들어온 사람이 있으면 가입이 26명을
     넘어 전환율이 100%를 넘을 수 있고, 그건 입소문이 돌았다는 좋은 신호다.)
   - **지난 24시간 변화**: 어제 신규 가입 N명, 어제 활동(페이지뷰24h>0) N명, 새 초대 발송/수락 N건.
     (자정 트리거의 핵심 — "어제 무슨 일이 있었나")
   - **LQ 신호**:
     - LQ1(다시 오나) = "2회차 도달" 비율 + 어느 기능에서 2회차가 가장 많이 나왔는지.
     - LQ2(함께 쓰나) = 초대 발송·수락 + "함께" 사용자 수. "함께" vs "혼자" 사용자의 평균 활동일수를
       비교해 가설③(관계=리텐션)이 살아있는지 한 줄 코멘트.
   - **주의 신호**: 가입했지만 활동일수 0~1인 사람(이탈 위험) 이름 나열.
   - 마지막에 전체 표(이름·이메일 포함)를 붙인다.
   - 데이터가 아직 적으면(가입 5명 미만) "표본이 작아 추세 해석은 이름. 신호만 기록"이라고 명시.

4. 리포트만 출력한다. 파일 수정·커밋은 하지 않는다(읽기 전용 보고).

## 참고
- **명단(`retention-test-emails.txt`)은 더 이상 쓰지 않는다.** 가입=자동 추적.
- 초대했지만 가입하지 않은 사람은 잡히지 않는다(이메일을 미리 모으지 않으므로). 즉
  "초대→가입 전환율"은 이 리포트로 안 나오고, 가입 이후 행동(LQ1·LQ2)만 본다.
- 페이지뷰는 2026-06-05 배포 이후부터 기록됨. 그 전 방문은 소급 없음.
- 쓰기 행동(일지·답변·일기·글·초대)은 과거치 포함 전부 집계됨.
- 측정 설계 배경: `docs/interview-guide.md`(LQ1·LQ2), `docs/strategy.md` 5절(가설③).

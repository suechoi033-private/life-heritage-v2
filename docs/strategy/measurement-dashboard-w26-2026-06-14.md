# W26 게이트 측정 대시보드 — M1~M8 통합

> 작성: 2026-06-14. 사업전략(life-heritage-strategy).
> 트리거: 사장님 — *"잇다 W26 게이트의 metric M1~M8을 한 곳에서 일목요연하게. 베타테스트(retention-report skill)와 합쳐 한 화면에서 합격 여부 판단할 수 있게."*
> 단일 원천: `docs/strategy/acquisition-task-oriented-2026-06-13.md`(M1·M2·M3), `docs/strategy/decisions-2026-06-14.md`(M4·M5), `docs/strategy/answer-invite-loop-2026-06-14.md`(M6·M7·M8), `docs/business-plan-v3.md`(10·11장 QAU·가설 a~d), `.claude/commands/retention-report.md`(베타테스트 일일 보고 SQL).
> 스코프: 분석·통합. 코드 0. 본 문서는 사장님이 한 화면에서 W26 게이트 합격 여부를 판단하기 위한 **단일 진실의 원천(single source of truth)**.

---

## 0. 사장님 한 화면 요약 (1페이지)

> W26 = 2026-12-27 전후(기준일에서 26주). 합격선·합/불은 `[추정]`. 측정 가능 여부는 본 라운드(2026-06-14 reflection 시리즈 인프라까지) 기준.

| # | 이름 | 한 줄 정의 | 합격선[추정] | 측정 가능? | placeholder |
|---|---|---|---|---|---|
| **M1** | organic D30 재방문율 | 검색/SNS organic 유입 가입자의 D30 1회+ 재방문 | ≥ 20% | △ (referrer 기록 부분) | ⚠️ |
| **M2** | 콘텐츠 정독률 | 가입자 중 D30 안 시드 콘텐츠 3편+ 70% 스크롤 | ≥ 15% | ❌ (스크롤 이벤트 미가동) | ❌ |
| **M3** | organic 글→가입 전환율 | 비식별 방문 → 가입(또는 베타 신청) | ≥ 1%/글, ≥ 0.3% 전체 | △ (cta_clicks·beta.html funnel 일부) | ⚠️ |
| **M4** | 자기성찰 시리즈 완주율 | 시리즈 Q1 시작자 중 Q5(옵트인)까지 도달 | ≥ 30% | ✅ (본 라운드 인프라 완비) | ✅ |
| **M5** | 약속 이행률 | 옵트인 후 "오늘 했어요" 1회+ 클릭 | ≥ 40% | ❌ (`app_events.reflection_promise_kept` 미등재, 버튼 미구현) | ❌ |
| **M6** | 답변 후 공유율 | Q5 완주자 중 (b)·(d) 공유 카드 1회+ 클릭 | ≥ 15% | ❌ (공유 카드 UI·이벤트 미구현) | ❌ |
| **M7** | 초대 링크 → 가입 전환율 | `friend_invites` 발급 → 가입 완료 | ≥ 5% | ✅ (`friend_invites.accepted_at` 운영 중) | ✅ |
| **M8** | 초대받아 가입한 D30 재방문 | 초대 토큰으로 가입한 사용자 D30 1회+ 재방문 | ≥ 30% | △ (코호트 분리는 가능, 페이지뷰 2026-06-05 이후만) | ⚠️ |

**한눈에 — 현재 상태**:
- ✅ 즉시 측정 가능: **M4 · M7** (2개)
- ⚠️ 부분 측정 가능: **M1 · M3 · M8** (3개)
- ❌ 측정 인프라 갭: **M2 · M5 · M6** (3개)

**우선순위 metric 3개 (가장 중요한 셋)**: **M1 · M7 · M8.**
- 셋 다 "사람들이 진짜로 다시 오는가 / 진짜로 권하는가"라는 v3 활성 가설·관계 리텐션 가설(strategy.md 5장)의 직접 시험.
- M2·M3·M6는 보조 (콘텐츠 엔진 작동 여부), M4·M5는 reflection 시리즈 작동 여부(가설 e).

---

## 1. M1~M8 통합 테이블

| # | 이름 | 정의 | 잠정 합격선[추정] | 측정 출처 | W26 액션 (≥ 합격 / 중간 / 미달) | 가설 매핑 |
|---|---|---|---|---|---|---|
| **M1** | organic D30 재방문율 | 검색·인스타 organic 글에서 유입된 가입자(UTM 또는 referrer 기반) 중 D30 안 1회+ 재방문 | ≥ 20% | `profiles`(가입), `app_events`(페이지뷰) + UTM/referrer 메타. **referrer 기록 일부 — D2 라운드에서 보강** | ≥20: 활성 가설 살아있음 / 10–20: 카피·온보딩 다듬기 / <10: task-only 모델 좁힘 검토 | **가설 e** (활성 가설, 20-40대 일상 진입) |
| **M2** | 콘텐츠 정독률 | 가입자 중 30일 안 시드 콘텐츠 3편+ 70% 스크롤 비율 | ≥ 15% | 스크롤·체류 이벤트(미가동). 본 라운드 미구현 — `app_events`에 `event_type='content_scroll'` 등재 필요 | ≥15: QAU 활성 레이어 작동 / 5–15: 콘텐츠 톤·길이 검토 / <5: 콘텐츠 입구만, retention 동력 X | **가설 e**, v3 10장 QAU 정의 "콘텐츠 3편+ 정독" 직접 충족 |
| **M3** | organic 글→가입 전환율 | 인스타·검색 방문자 중 가입(또는 베타 신청) 전환 | ≥ 1%/글, ≥ 0.3% 전체 | 글 단위 page view × signup attribution. **익명 카운터 + 자가신고 referrer**(헌장 — 외부 추적 X). 현재 `cta_clicks` 일부, beta.html funnel 부분 | ≥1%: 콘텐츠 acquisition 엔진 작동 / 0.3–1%: 카피·CTA 다듬기 / <0.3%: paid 검토 vs 콘텐츠 재설계 갈림 | **가설 e**, BM 다각화 신호 |
| **M4** | 자기성찰 시리즈 완주율 | 시리즈 Q1(`series_step=1`) 답변자 중 Q5(`series_step=5`)까지 완료. 사별 분기는 Q3a([사별] 마킹)까지를 완료로 봄 | ≥ 30% | `daily_questions.series_key='not_waking_tomorrow'` + `daily_answers`. **본 라운드 인프라 완비** | ≥30: 가설 e 확장(통합), 카피 최소 다듬기 / 15–30: 시리즈 흐름 검토(Q3 분기·사별 노출) / <15: 진입점 재설계(홈 카드 카피·위치) | **가설 e** (1차 신호) |
| **M5** | 약속 이행률 | M4 완주 + 옵트인 사용자 중 "오늘 했어요" 1회+ 클릭 | ≥ 40% | `app_events`에 `reflection_promise_kept` 등재 필요(미구현) + 홈/reflection.html "오늘 했어요" 버튼(미구현). **본 라운드 미구현 — 다음 PE 라운드** | ≥40: 푸시 알람 채널(FCM·OneSignal) 별도 라운드 발화 / 20–40: in-app 카피·노출 빈도 다듬기 / <20: 약속 메커니즘 재검토 | **가설 e** (행동 격차 검증) |
| **M6** | 답변 후 공유율 | Q5 완주 사용자 중 직후 노출되는 (b) "같이 답하기" 또는 (d) "○○님께 보내기" 카드 1회+ 클릭 | ≥ 15% | localStorage 이벤트 1차 / `app_events.event_type='share_card_click'` 2차. **공유 카드 UI 자체가 미구현** | ≥15: 시리즈 공유 동기 작동, (a) 카드 공유 추가 검토 / 5–15: 카피·위치 다듬기 / <5: 시나리오 자체 재설계 또는 본 루프 보류 | **가설 e** + 관계 리텐션(strategy.md 5장) |
| **M7** | 초대 링크 → 가입 전환율 | `friend_invites` 발급(`channel='reflection_q1'` 우선) 중 URL 진입 → 가입 완료 | ≥ 5% | `friend_invites.invite_code`·`accepted_at`·`accepted_user_id` (이미 운영 중). **본 라운드 인프라 완비** — `channel` 값 추가만 필요 | ≥5: 초대가 organic acquisition 채널로 작동, 카피 다듬기 + 다음 시리즈 확장 / 1–5: 초대장 카피·첫 화면 다듬기 / <1: (d) 직접 보내기에 집중, (b) 보류 | **가설 e** + 관계 리텐션 + D5 BM 다각화 |
| **M8** | 초대받아 가입한 D30 재방문 | 초대 토큰으로 가입한 사용자 코호트의 D30 안 1회+ 재방문 | ≥ 30% | `friend_invites.accepted_user_id` 코호트 + `app_events` 페이지뷰 + 기존 retention-report SQL의 `최근방문` 로직. **페이지뷰 2026-06-05 이후만** | ≥30: organic 초대가 인스타보다 강한 채널 입증 → paid(D7) 더 미룸 / 15–30: 가입 직후 nudge 보강 / <15: 초대 동기-retention 격차, 시점 재검토 | **가설 e** + 관계 리텐션 (strategy.md 5장) — 가장 강한 입증 후보 |

**합격선 수치의 출처와 한계** (정직성):
- 모든 수치는 **[추정]**. 한국 lifecycle 콘텐츠 카테고리 벤치마크 없음.
- W13(3개월) 기준선 데이터 후 W26 직전 재보정 권장.
- 임의 목표선이 되지 않도록 W13 라운드에서 한 번 짚는다.

---

## 2. retention-report skill과의 매핑 — 단일 진실의 원천

### 2.1 retention-report가 자동 집계하는 것

`.claude/commands/retention-report.md`의 SQL이 매일 자정 KST에 측정:

| retention-report 컬럼 | 의미 | 본 대시보드와의 관계 |
|---|---|---|
| `가입수단` (`auth_provider`) | email · kakao · google 등 | 본 대시보드의 channel 분리(M1)의 원시 신호. 단, **referrer는 별도** |
| `페이지뷰누적` / `페이지뷰24h` / `마지막방문` | `app_events` 집계 | **M1·M8 D30 재방문의 원시 신호** |
| `활동일수` | care_logs/daily_answers/diary_entries/community_posts/app_events 합집합 | **M4 시리즈 답변 활동의 부분 신호** (시리즈 Q1만 카운트되면 M4 분모) |
| `2회차도달` | 4개 쓰기 행동 중 어느 하나 ≥ 2 | 본 대시보드에는 **직접 metric 아님** (관계 리텐션의 v3 보조 지표 `LQ1`). 단, M8 합격 여부 정성 보강용 |
| `초대보냄` / `초대수락` | `care_members` + `friend_invites.accepted_at` | **M7 초대 → 가입 funnel의 원시 신호** (직접 분자) |
| `혼자vs함께` | care_subjects + care_members 관계 | strategy.md 5장 가설 LQ2 — **M7·M8과 강한 정합**, 정성 보강 |

### 2.2 중복·정합 정리

| metric | retention-report로 측정 가능? | 본 대시보드 SQL 별도 필요? | 단일 원천 |
|---|---|---|---|
| **M1** | △ (페이지뷰 24h·마지막방문으로 D30 재방문 부분 추출 가능) | ○ — channel(organic vs 케어링) 분리 필요 | **본 대시보드 SQL**. retention-report는 정성 보강. |
| **M2** | ❌ | ○ — 스크롤 이벤트 필요 (`app_events.event_type='content_scroll'` 등재 전제) | 본 대시보드 (미구현 metric) |
| **M3** | ❌ | ○ — 익명 페이지뷰 + 가입 attribution | 본 대시보드 (미구현 metric) |
| **M4** | △ (`질문답변` 카운트로 부분) | ○ — `series_key`·`series_step` 분기 | **본 대시보드 SQL** |
| **M5** | ❌ | ○ — `reflection_promise_kept` 이벤트 (미등재) | 본 대시보드 (미구현) |
| **M6** | ❌ | ○ — `share_card_click` 이벤트 (미등재) | 본 대시보드 (미구현) |
| **M7** | ✅ **직접 측정 중** (`초대수락` 컬럼이 분자, `friend_invites` 발급 수가 분모) | △ — channel 필터만 추가 | **retention-report 활용** + 본 대시보드는 channel 필터링 보강 |
| **M8** | ✅ **간접 측정 중** (`초대수락` 가입자에 대해 `페이지뷰누적`/`마지막방문`으로 D30 재방문 보임) | △ — 30일 window 명시 | **retention-report 활용** + 본 대시보드는 D30 window 정형화 |

**단일 원천 결정**:
1. **M7 · M8 = retention-report 우선.** 매일 자정 자동, 사장님 일상 동선 동일. 본 대시보드는 그 위에 W26 합격선 라인만 그어둠.
2. **M1 · M4 = 둘 다 사용.** retention-report는 데일리 추세, 본 대시보드 SQL은 W26 게이트 시점 정형 판정.
3. **M2 · M3 · M5 · M6 = 본 대시보드의 책임.** retention-report 범위 밖 — 별도 이벤트 인프라 갭(아래 5장).
4. **중복 측정 금지.** M7·M8을 본 대시보드 SQL에서 분자로 두되, 일상은 retention-report가 본다.

### 2.3 베타테스트 데이터가 비추는 가설

retention-report의 `혼자vs함께` 컬럼 + `2회차도달`은 strategy.md 5장의 **가설 ③(관계가 리텐션 엔진)**의 직접 시험. 본 대시보드의 M7·M8과 같은 신호다.

- **M7 합격 + retention-report `초대수락` 상승 = 가설 ③ 강화**.
- **M8 합격 + retention-report `함께` 사용자 활동일수 > `혼자` = 가설 ③ 강한 확증**.
- 둘 다 미달이면 잇다는 task-only 모델로 좁아짐(`acquisition-task-oriented-2026-06-13.md` 1.2장).

---

## 3. 통합 단일 SQL 초안 — W26 게이트 한 번에

> 사장님이 Supabase SQL Editor에서 한 번 돌리면 M1~M8 모두 값(또는 "미구현" 표시)이 나오는 통합 쿼리. **D30 window는 가입일 기준 30일**. `test_start`는 retention-report와 같은 변수 형태 유지(독립 변경 가능).

```sql
-- =============================================================
-- W26 게이트 측정 대시보드 — M1~M8 통합
-- 단일 원천: docs/strategy/measurement-dashboard-w26-2026-06-14.md
-- =============================================================
with params as (
  select
    timestamptz '2026-06-08 00:00:00+09' as test_start,  -- W26 측정 기준 시작일
    interval '30 days' as d30_window
),

-- ============================================================
-- 코호트 정의
-- ============================================================
cohort_all as (
  -- 전체 가입자 (테스트 시작일 이후, 잇다 내부 이메일 제외)
  select p.id as user_id, p.created_at as signed_up_at,
         coalesce(p.auth_provider,'email') as auth_provider
    from public.profiles p, params
   where p.created_at >= params.test_start
     and p.email not ilike '%@itda.net'
),
cohort_organic as (
  -- M1 분모: organic 진입 가입자 (referrer/utm 메타에 organic 신호)
  -- 주의: 현재 referrer 기록 부분 — D2 라운드 보강 전엔 분모가 작음.
  select c.user_id, c.signed_up_at
    from cohort_all c
    left join lateral (
      select 1 from public.app_events e
       where e.user_id = c.user_id
         and (e.meta->>'referrer' ilike '%instagram%'
           or e.meta->>'referrer' ilike '%google%'
           or e.meta->>'referrer' ilike '%naver%'
           or e.meta->>'utm_source' is not null)
       limit 1
    ) referer_hit on true
   where referer_hit is not null
),
cohort_invited as (
  -- M8 분모: 초대 토큰으로 가입한 사용자
  select c.user_id, c.signed_up_at
    from cohort_all c
    join public.friend_invites fi on fi.accepted_user_id = c.user_id
   where fi.accepted_at is not null
),

-- ============================================================
-- 재방문 (D30) 계산 — M1, M8
-- ============================================================
revisit_d30 as (
  select c.user_id
    from cohort_all c, params
   where exists (
     select 1 from public.app_events e
      where e.user_id = c.user_id
        and e.created_at > c.signed_up_at + interval '1 day'    -- 가입 당일 제외
        and e.created_at <= c.signed_up_at + params.d30_window
   )
),

-- ============================================================
-- M4: 자기성찰 시리즈 완주율
-- ============================================================
series_started as (
  select distinct a.user_id
    from public.daily_answers a
    join public.daily_questions q on q.id = a.question_id
   where q.series_key = 'not_waking_tomorrow' and q.series_step = 1
     and a.user_id in (select user_id from cohort_all)
),
series_finished as (
  select distinct a.user_id
    from public.daily_answers a
    join public.daily_questions q on q.id = a.question_id
   where q.series_key = 'not_waking_tomorrow' and q.series_step = 5
     and a.user_id in (select user_id from cohort_all)
),

-- ============================================================
-- M7: 초대 → 가입 전환율
-- ============================================================
invites_issued as (
  select count(*)::numeric as n
    from public.friend_invites
   where created_at >= (select test_start from params)
),
invites_accepted as (
  select count(*)::numeric as n
    from public.friend_invites
   where created_at >= (select test_start from params)
     and accepted_at is not null
)

-- ============================================================
-- 최종 통합 출력
-- ============================================================
select
  -- M1
  'M1' as metric,
  'organic D30 재방문율' as 이름,
  '≥ 20%' as 합격선,
  (select count(*) from revisit_d30 r where r.user_id in (select user_id from cohort_organic))::numeric
    / nullif((select count(*) from cohort_organic), 0) as 값,
  '⚠️ referrer 기록 부분 — D2 라운드 보강 전엔 분모 과소' as 비고
union all
select 'M2', '콘텐츠 정독률', '≥ 15%', null::numeric,
       '❌ 미구현 — app_events.event_type=content_scroll 등재 필요'
union all
select 'M3', 'organic 글→가입 전환율', '≥ 0.3% 전체', null::numeric,
       '⚠️ 부분 — cta_clicks·beta.html funnel attribution 보강 필요'
union all
-- M4
select 'M4', '자기성찰 시리즈 완주율', '≥ 30%',
       (select count(*) from series_finished)::numeric
         / nullif((select count(*) from series_started), 0),
       '✅ 본 라운드 인프라 완비'
union all
select 'M5', '약속 이행률', '≥ 40%', null::numeric,
       '❌ 미구현 — reflection_promise_kept 이벤트 + 오늘 했어요 버튼 필요'
union all
select 'M6', '답변 후 공유율', '≥ 15%', null::numeric,
       '❌ 미구현 — 공유 카드 UI + share_card_click 이벤트 필요'
union all
-- M7
select 'M7', '초대 링크 → 가입 전환율', '≥ 5%',
       (select n from invites_accepted) / nullif((select n from invites_issued), 0),
       '✅ 본 라운드 인프라 완비'
union all
-- M8
select 'M8', '초대받아 가입한 D30 재방문', '≥ 30%',
       (select count(*) from revisit_d30 r where r.user_id in (select user_id from cohort_invited))::numeric
         / nullif((select count(*) from cohort_invited), 0),
       '⚠️ 페이지뷰 2026-06-05 이후만 — 코호트 가입 후 30일 window 정형'
order by metric;
```

**SQL 한계 (정직)**:
- 한 번에 다 측정 **불가**. M2 · M5 · M6는 이벤트 인프라 갭 — 본 SQL에서 `null` 반환 + "미구현" 라벨.
- M1·M3는 referrer/UTM 메타가 충분치 않아 **분모 과소·신호 약함**.
- M4·M7·M8 3개만 본 SQL로 **실측 가능**.
- 즉 본 SQL은 "단일 실행으로 W26 게이트 라인업의 라벨·구조"는 한 번에 보여주지만, **8개 metric의 실수치를 다 채우진 못함**.

---

## 4. W26 게이트 판정 매트릭스

### 4.1 정직성 먼저 — 8개 다 합격은 어렵다

- 8개 모두 합격선 ≥ : **사실상 불가능** (잇다 자체 BM·관계 가설이 100% 정답이라는 의미). 그런 결과가 나오면 측정 자체를 의심해야 함.
- 현실적인 의사결정 라인: **우선순위 metric 3개(M1·M7·M8)** 의 통과 여부 + 보조 metric 5개의 신호 강도.

### 4.2 판정 매트릭스

| 시나리오 | M1 | M7 | M8 | 보조 metric | 결정 | 사유 한 줄 |
|---|---|---|---|---|---|---|
| **A. 완전 합격 (우선순위 3개 + 보조 3개+ 합격)** | ≥ | ≥ | ≥ | M2·M3·M4·M5·M6 중 3개+ ≥ | **가설 e 확장.** Axis A·B 통합 메인 진입, 콘텐츠 시리즈 확대. paid 검토 유보(D7), organic으로 충분. | 활성+관계 가설 모두 살아있음 |
| **B. 부분 합격 — 관계 강세 (M7·M8 ≥, M1 부분 또는 ❌)** | < | ≥ | ≥ | M4 ≥ | **관계 리텐션 본진 + 카피 다듬기.** acquisition은 인스타·콘텐츠 카피 재설계. 답변→초대 루프 본격 운영. | 관계 가설은 강함, 콘텐츠 acquisition은 미흡 — 인스타·시드 콘텐츠 재설계 |
| **C. 부분 합격 — 활성 강세 (M1 ≥, M7 or M8 미달)** | ≥ | <5% | <30% | M2·M3 ≥ | **콘텐츠 엔진 본진 + 초대 시점 재설계.** Modern Loss 패턴(콘텐츠 only)으로 좁힘 위험 — 초대 시점·카피 재설계 1회 더 시도 후 12개월에 재판정. | 활성은 만들고 있으나 관계 루프 미발화 — D5 BM 다각화 신호 약화 |
| **D. 부분 합격 — 시리즈만 (M4 ≥, M1·M7·M8 미달)** | < | < | < | M4 ≥ 30%, M5 미상 | **진입점 재설계 + 시리즈 카피 미세조정.** 자기성찰 시리즈 자체는 작동 — 진입 동선(홈 카드 위치·카피)이 막힘. 인스타 organic D3 확장 + 베타 페이지 카피 재craft. | 사용자는 시리즈를 끝까지 답하지만 그 효과가 acquisition·retention으로 안 흐름 |
| **E. 우선순위 3개 모두 미달** | < | < | < | 무관 | **task-only 모델로 좁힘 검토.** 잇다는 슈카츠넷에 가까운 케어링·사전준비 task 앱으로 재정의. 활성 가설(20-40대 일상 진입) 영구 폐기 또는 12개월 추가 유보. paid 광고는 그래도 **즉시 금지** — 죽은 가설에 돈 태우면 함정 심화. | 활성+관계 둘 다 신호 없음 |
| **F. M5·M6만 실측, 우선순위 3개 미상** | 미측 | 미측 | 미측 | M5 ≥ or M6 ≥ | **W26 판정 보류, W26+4(약 1개월) 재측정.** 측정 인프라 갭이 판정을 막은 시나리오 — PE 라운드로 referrer·이벤트 인프라 보강 후 재판정. | 사장님 결정 미루지 않되 결정에 필요한 데이터가 부족 — 인프라 응급 보강 |

### 4.3 paid 검토는 어디서 발화하는가

- `acquisition-task-oriented-2026-06-13.md` 5.2장 + D7: paid 진입 조건 = **M1·M2·M3 한 개+ 합격 + organic 단위 CAC 측정 가능**.
- 본 대시보드에서는 **시나리오 C에서만 paid 소액 테스트(월 50만 원 이내) 검토 발화**.
- A·B는 organic으로 충분, D·E·F는 paid 금지(가설 미검증에 돈 태우면 슈카츠넷 함정).

### 4.4 사장님이 판정일에 보는 한 화면

```
W26 게이트 판정 — YYYY-MM-DD
─────────────────────────────
[우선순위]
  M1 = __%  (≥ 20%)  ✅/⚠️/❌
  M7 = __%  (≥ 5%)   ✅/⚠️/❌
  M8 = __%  (≥ 30%)  ✅/⚠️/❌

[보조]
  M2 = __%  M3 = __%  M4 = __%  M5 = __%  M6 = __%

[시나리오 매칭] = A/B/C/D/E/F
[결정] = ___________
[다음 라운드 위임] = PE/카피라이터/마케터 ___개 카드
```

---

## 5. 데이터 수집 인프라 갭 + 다음 PE 위임 범위

### 5.1 현재 갭 (본 라운드 미구현)

| 갭 항목 | 영향 metric | 구현 비용[추정] | one-way door? |
|---|---|---|---|
| **referrer/UTM 메타 정형화** (`app_events.meta`에 첫 진입 referrer·utm_source 저장) | M1, M3, M8 | 1-2일 PE | two-way (스키마 변경 0, JS 보강만) |
| **콘텐츠 스크롤·체류 이벤트** (`event_type='content_scroll'`, depth %, 체류초) | M2 | 2-3일 PE | two-way |
| **`reflection_promise_kept` 이벤트** (홈/reflection.html "오늘 했어요" 버튼 + `app_events` 등재) | M5 | 2일 PE + 카피 1회 | two-way |
| **`share_card_click` 이벤트** ((b)·(d) 공유 카드 UI + `app_events` 등재) | M6 | 3-4일 PE + 카피라이터 + 디자인 | two-way |
| **`friend_invites.channel`에 `reflection_q1` 값 추가** + 비로그인 reflection.html?invited_by=XXX | M7 (정밀도), M6의 전제 | 2일 PE | two-way |
| **beta.html funnel attribution** (인스타 진입 → 페이지뷰 → 가입 4단계) | M3 | 1-2일 PE | two-way |

### 5.2 다음 PE 위임 범위 한 줄

**referrer/UTM 정형화 + content_scroll·reflection_promise_kept·share_card_click 3개 이벤트 등재 + reflection.html invited_by 모드 — 총 PE 라운드 1회(약 5-7일).**

### 5.3 위임 우선순위 (PE 라운드 안에서)

1. **1순위 (M1 살림)**: referrer/UTM 정형화. 다른 모든 metric의 코호트 분리 기반.
2. **2순위 (M7 정밀도 + M6 전제)**: `friend_invites.channel='reflection_q1'` + reflection.html invited_by 모드 + localStorage 임시 저장.
3. **3순위 (M5)**: 홈 "오늘 했어요" 버튼 + `reflection_promise_kept` 이벤트.
4. **4순위 (M6)**: 공유 카드 (b)·(d) UI + `share_card_click` 이벤트.
5. **5순위 (M2)**: 콘텐츠 스크롤 이벤트. 가장 무겁고 W13 기준선 데이터 누적 시간 필요 — 늦게 시작해도 W26 직전 1개월이면 부분 신호 가능.

### 5.4 W26 직전 측정 시간표

- **W13 (2026-09-13 전후)**: 기준선 데이터로 합격선(M1 20% / M7 5% / M8 30% 등) 재보정 1회. 임의 목표선 방지.
- **W20 (2026-10-31 전후)**: M2·M5·M6 인프라 완비 데드라인. 이후 부터 본 측정.
- **W26 (2026-12-27 전후)**: 본 대시보드 SQL 1회 실행 + retention-report 데이터와 합쳐 판정.

---

## 6. 정직성 라벨

- **M1~M8 합격선 수치 모두 [추정]**. 한국 lifecycle 카테고리 벤치마크 없음. W13 기준선 데이터로 재보정 1회 필수.
- **M2 · M5 · M6 = 본 라운드 미구현**. W26 판정에서 빠질 가능성 — 시나리오 F 발화 risk.
- **M1 · M3 = referrer/UTM 기록 부분**이라 분모 과소. PE 라운드에서 정형화 전엔 신호 약함.
- **M8 = 페이지뷰 로그 2026-06-05 이후만 누적**. 그 전 가입자 코호트는 D30 재방문 추정 불가.
- **retention-report skill과의 중복**: M7 · M8은 사실상 retention-report가 일상 측정 중 — 본 대시보드는 W26 시점 정형 판정 라인만 그어둠. 일상은 retention-report.
- **판정 매트릭스 시나리오 A~F의 결정 방향**도 [추정]. 사장님 직관·당시 시장 환경·자원 여건에 따라 미세조정 필수.
- **가설 e (활성 가설)**는 `acquisition-task-oriented-2026-06-13.md`·`answer-invite-loop-2026-06-14.md`에서 등재됐으나 v3 11장 4대 가설(a/b/c/d) 정식 등재는 아직. **W26 게이트 전 v3 11장 갱신 필요**.

---

## 부록 A: 본 문서가 다루지 않은 것

- **W26 판정일의 실제 결정 회의 운영**. 운영 라운드.
- **PE 라운드의 줄 단위 구현 명세**. 본 문서는 갭·우선순위까지. 구현은 PE 라운드.
- **카피라이터 라운드의 카피 craft**. "오늘 했어요" · 공유 카드 · 초대장 카피는 카피라이터.
- **paid 광고 진입 시점의 자세한 조건**. `acquisition-task-oriented-2026-06-13.md` 5.2장 + D7 그대로 유효.
- **케어링 task-oriented 페르소나의 retention 강화 metric**. 별도 라운드. 본 대시보드는 활성 가설 중심.

## 부록 B: 가장 큰 약점 1개 (정직히)

**8개 metric 중 3개(M2·M5·M6)가 본 라운드에 미구현이라 W26 게이트가 시나리오 F(보류) 로 빠질 risk가 가장 크다.** 그럼에도 우선순위 3개(M1·M7·M8)는 부분 측정 가능 — 보류로 빠지지 않게 PE 라운드 우선순위 1·2(referrer + reflection 초대 모드)만이라도 W20 전에 끝내야 한다.

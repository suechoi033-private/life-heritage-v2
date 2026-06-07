-- ============================================================
-- 잇다 리텐션 테스트 — 자동 집계 리포트 (명단 입력 불필요)
-- ============================================================
-- 사용법:
--   1) 아래 test_start 한 줄만 "테스트 시작일(KST)"로 바꾼다.
--   2) Supabase 대시보드 → SQL Editor 에 붙여넣고 실행.
--   → 시작일 이후 가입한 사람(=실제 테스터)이 이름·이메일과 함께 자동으로 잡힌다.
--
-- 왜 명단이 필요 없나:
--   가입할 때 입력한 이름·이메일이 트리거(handle_new_user)로 public.profiles 에
--   자동 저장된다. 그래서 "누가 가입했는지"를 손으로 적을 필요가 없다.
--   test_start 이후 가입자만 코호트로 잡으므로, 시작일을 초대 보낸 날로 맞추면
--   기존 내부/테스트 계정은 자동으로 빠진다.
--
-- 한계(알아둘 것):
--   - 초대했지만 가입 안 한 사람은 잡히지 않는다(그 사람 이메일을 우리가 미리
--     모으지 않기 때문). 즉 "초대 X명 중 가입 Y명" 전환율은 이 표로는 안 나온다.
--     가입 이후 행동(재방문·2회차·재초대)만 본다 = 리텐션 측정엔 충분.
-- ============================================================

with params as (
  select
    timestamptz '2026-06-08 00:00:00+09' as test_start   -- ← 테스트 시작일(KST). 이 줄만 수정.
),
people as (
  select
    p.id          as user_id,
    p.name,
    p.email,
    p.auth_provider,
    p.created_at  as signed_up_at
  from public.profiles p, params
  where p.created_at >= params.test_start
    and p.email not ilike '%@itda.net'        -- 내부 테스트 계정 제외(필요시 추가)
)
select
  pe.name                                                                          as 이름,
  pe.email                                                                         as 이메일,
  coalesce(pe.auth_provider, 'email')                                              as 가입수단,
  pe.signed_up_at                                                                  as 가입시각,
  (pe.signed_up_at > now() - interval '24 hours')                                  as 어제가입,

  -- ── 재방문/방문 (LQ1 보조) ──
  (select count(*) from public.app_events e where e.user_id = pe.user_id)          as 페이지뷰수,
  (select count(*) from public.app_events e where e.user_id = pe.user_id
     and e.created_at > now() - interval '24 hours')                               as 페이지뷰24h,
  (select max(created_at) from public.app_events e where e.user_id = pe.user_id)   as 마지막방문,
  -- 활동한 날 수 (페이지뷰 + 모든 쓰기 통합, 하루 단위 distinct)
  (select count(distinct d) from (
      select date_trunc('day', created_at) d from public.app_events     where user_id = pe.user_id
      union all select date_trunc('day', created_at) from public.care_logs       where user_id = pe.user_id
      union all select date_trunc('day', created_at) from public.daily_answers   where user_id = pe.user_id
      union all select date_trunc('day', created_at) from public.diary_entries   where user_id = pe.user_id
      union all select date_trunc('day', created_at) from public.community_posts where user_id = pe.user_id
   ) x)                                                                            as 활동일수,

  -- ── 기능별 작성 횟수 (LQ1 핵심: 어느 기능을 쓰나) ──
  (select count(*) from public.care_logs       c  where c.user_id  = pe.user_id)   as 케어일지,
  (select count(*) from public.daily_answers   a  where a.user_id  = pe.user_id)   as 질문답변,
  (select count(*) from public.diary_entries   d2 where d2.user_id = pe.user_id)   as 일기,
  (select count(*) from public.community_posts cp where cp.user_id = pe.user_id)   as 커뮤글,

  -- ── LQ1: 2회차 작성 도달 여부 (같은 기능 2회 이상) ──
  case when
       (select count(*) from public.care_logs       where user_id = pe.user_id) >= 2
    or (select count(*) from public.daily_answers   where user_id = pe.user_id) >= 2
    or (select count(*) from public.diary_entries   where user_id = pe.user_id) >= 2
    or (select count(*) from public.community_posts where user_id = pe.user_id) >= 2
    then 'Y' else 'N' end                                                          as "2회차도달",

  -- ── LQ2: 초대 보냄/수락 ──
  (select count(*) from public.care_members m
     where m.invited_by = pe.user_id and m.user_id is distinct from pe.user_id)    as 케어초대_보냄,
  (select count(*) from public.care_members m
     where m.invited_by = pe.user_id and m.user_id is distinct from pe.user_id
       and m.accepted_at is not null)                                              as 케어초대_수락,
  (select count(*) from public.friend_invites fi where fi.inviter_id = pe.user_id) as 친구초대_보냄,
  (select count(*) from public.friend_invites fi
     where fi.inviter_id = pe.user_id and fi.accepted_at is not null)              as 친구초대_수락,

  -- ── 가설③ 검증: 혼자 vs 함께 ──
  case when exists (
     select 1 from public.care_subjects s
     join public.care_members m on m.subject_id = s.id
     where s.user_id = pe.user_id and m.user_id is distinct from pe.user_id
  ) then '함께' else '혼자' end                                                     as "혼자vs함께"

from people pe
order by pe.signed_up_at;

-- ============================================================
-- 잇다 리텐션 테스트 — 자동 집계 리포트
-- ============================================================
-- 사용법:
--   1) Supabase 대시보드 → SQL Editor 열기
--   2) 아래 invited(...) VALUES 목록에 초대 시트의 이메일을 붙여넣기
--   3) 실행 → 사람별로 [가입·재방문·기능사용·2회차·초대] 한 표로 출력
--
-- 측정 출처:
--   - 가입/재방문/페이지뷰 → profiles.created_at, app_events (자동)
--   - 기능 사용/2회차      → care_logs·daily_answers·diary_entries·community_posts (자동)
--   - 초대(LQ2)            → care_members(invited_by)·friend_invites (자동)
--   - 혼자 vs 함께(가설③)  → 한 care_subject에 member 2명+ (자동)
-- 수기 입력 불필요. 테스트 기간 중 아무 때나 다시 실행하면 최신 현황.
-- ============================================================

with invited(email) as (
  values
    ('person1@example.com'),
    ('person2@example.com')
    -- ↑ 초대 시트 이메일 20개를 여기에 ('a@b.com'), 형태로 붙여넣기
),
people as (
  select
    lower(i.email)              as email,
    p.id                        as user_id,
    p.created_at                as signed_up_at
  from invited i
  left join public.profiles p on lower(p.email) = lower(i.email)
)
select
  pe.email,
  case when pe.user_id is null then '미가입' else '가입' end                       as 가입여부,
  pe.signed_up_at                                                                  as 가입시각,

  -- ── 재방문/방문 (LQ1 보조) ──
  (select count(*) from public.app_events e where e.user_id = pe.user_id)          as 페이지뷰수,
  (select max(created_at) from public.app_events e where e.user_id = pe.user_id)   as 마지막방문,
  -- 활동한 날 수 (페이지뷰 + 모든 쓰기 통합, 하루 단위 distinct)
  (select count(distinct d) from (
      select date_trunc('day', created_at) d from public.app_events     where user_id = pe.user_id
      union all select date_trunc('day', created_at) from public.care_logs       where user_id = pe.user_id
      union all select date_trunc('day', created_at) from public.daily_answers   where user_id = pe.user_id
      union all select date_trunc('day', created_at) from public.diary_entries   where user_id = pe.user_id
      union all select date_trunc('day', created_at) from public.community_posts where user_id = pe.user_id
   ) x)                                                                            as 활동일수,
  -- 가입 후 며칠째까지 활동했나 (재방문 깊이)
  (select coalesce(max(date_trunc('day', created_at)::date) - pe.signed_up_at::date, 0)
     from public.app_events e where e.user_id = pe.user_id)                        as 마지막활동_가입후일수,

  -- ── 기능별 작성 횟수 (LQ1 핵심: 어느 기능을 쓰나) ──
  (select count(*) from public.care_logs       c  where c.user_id  = pe.user_id)   as 케어일지,
  (select count(*) from public.daily_answers   a  where a.user_id  = pe.user_id)   as 질문답변,
  (select count(*) from public.diary_entries   d2 where d2.user_id = pe.user_id)   as 일기,
  (select count(*) from public.community_posts cp where cp.user_id = pe.user_id)   as 커뮤글,
  (select count(*) from public.goals           g  where g.user_id  = pe.user_id)   as 목표,

  -- ── LQ1: 2회차 작성 도달 여부 (같은 기능 2회 이상) ──
  case when
       (select count(*) from public.care_logs       where user_id = pe.user_id) >= 2
    or (select count(*) from public.daily_answers   where user_id = pe.user_id) >= 2
    or (select count(*) from public.diary_entries   where user_id = pe.user_id) >= 2
    or (select count(*) from public.community_posts where user_id = pe.user_id) >= 2
    then 'Y' else 'N' end                                                          as "2회차도달",

  -- ── LQ2: 초대 보냄/수락 ──
  -- 케어 초대로 실제 합류한 멤버 수 (본인 제외)
  (select count(*) from public.care_members m
     where m.invited_by = pe.user_id and m.user_id is distinct from pe.user_id)    as 케어초대_보냄,
  (select count(*) from public.care_members m
     where m.invited_by = pe.user_id and m.user_id is distinct from pe.user_id
       and m.accepted_at is not null)                                             as 케어초대_수락,
  (select count(*) from public.friend_invites fi where fi.inviter_id = pe.user_id) as 친구초대_보냄,
  (select count(*) from public.friend_invites fi
     where fi.inviter_id = pe.user_id and fi.accepted_at is not null)             as 친구초대_수락,

  -- ── 가설③ 검증: 혼자 vs 함께 (본인이 만든 care_subject에 다른 멤버가 있나) ──
  case when exists (
     select 1 from public.care_subjects s
     join public.care_members m on m.subject_id = s.id
     where s.user_id = pe.user_id and m.user_id is distinct from pe.user_id
  ) then '함께' else '혼자' end                                                     as "혼자vs함께"

from people pe
order by 가입여부, pe.signed_up_at nulls last;

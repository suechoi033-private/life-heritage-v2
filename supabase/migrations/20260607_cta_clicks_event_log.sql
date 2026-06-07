-- =============================================================
-- 두 갈래 CTA 클릭 계측 — cta_clicks 이벤트 로그
--
-- 목적: 상속 브리지 콘텐츠(§6 검증 실험 1)의 핵심 선행지표
--   "미래 CTA 클릭률 ÷ 지금 CTA 클릭률" 을 글·세션 단위로 집계.
--   docs/content-bridge-inheritance.md §2-4(두 갈래 CTA), §5(측정), §6(실험 1).
--
-- ※ 적용 보류(one-way door): 이 파일은 작성만 해 둔 것이며,
--   창업자/메인세션 승인 + 백업 확인 후에만 Supabase SQL Editor에서 실행한다.
--   apply_migration·execute_sql 로 직접 실행 금지.
--
-- 설계 원칙:
--   * 익명(비로그인) 유입자도 측정해야 한다 — 상속 검색자는 대부분 비회원.
--     → INSERT는 anon/authenticated 모두 허용(RLS). 단 SELECT는 막아
--       프라이버시·악용 방지(집계는 service_role/관리자만).
--   * 개인식별 최소화: user_id는 로그인 상태에서만 선택적으로 기록(NULL 허용).
--     session_key는 클라이언트가 만든 익명 난수(쿠키 아님, sessionStorage) —
--       같은 세션에서 두 버튼을 눌렀는지 구분하는 용도. 개인 식별 불가.
-- =============================================================

begin;

create table if not exists public.cta_clicks (
  id           uuid primary key default gen_random_uuid(),
  content_id   uuid references public.contents(id) on delete cascade,
  -- 'now'  = (지금) 사별 후 90일 체크리스트
  -- 'future' = (미래) 내가 떠난 뒤 가족이 안 헤매게 — 지금 정리해두기
  cta_branch   text not null check (cta_branch in ('now', 'future')),
  cta_label    text,                 -- 노출된 실제 버튼 문구(카피 A/B 추적용)
  cta_href     text,                 -- 이동 목적지(경로 변경 추적용)
  -- 실험 식별자(여러 글/버전을 묶어 보기 위함). 예: 'exp1-g3'
  experiment   text,
  -- 익명 세션 키(클라이언트 생성 난수). 세션 단위 분모 산출용. 개인 식별 불가.
  session_key  text,
  user_id      uuid references public.profiles(id) on delete set null,
  -- 유입 맥락(선택): utm/referrer 등 간단 메타. 자유 jsonb.
  meta         jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists cta_clicks_content_branch_idx
  on public.cta_clicks (content_id, cta_branch, created_at desc);
create index if not exists cta_clicks_experiment_idx
  on public.cta_clicks (experiment, created_at desc);
create index if not exists cta_clicks_session_idx
  on public.cta_clicks (session_key);

alter table public.cta_clicks enable row level security;

-- INSERT만 공개(익명 포함). 잘못된 분기값은 CHECK가 막고,
-- 컬럼은 측정용이라 위변조 위험이 낮다(집계 신뢰는 운영 단계에서 dedup으로 보강).
create policy "cta_clicks_anyone_insert" on public.cta_clicks
  for insert
  with check (cta_branch in ('now', 'future'));

-- SELECT 정책을 만들지 않음 → anon/authenticated 는 읽기 불가.
-- 집계는 service_role(관리자 콘솔/SQL Editor)로만 수행한다.

commit;

-- =============================================================
-- 지표 산출(운영자 SQL Editor에서 service_role로 실행)
--
-- (1) 글별 분기 클릭 수 + 핵심 비율(미래÷지금)
--   select
--     content_id,
--     count(*) filter (where cta_branch = 'now')    as now_clicks,
--     count(*) filter (where cta_branch = 'future') as future_clicks,
--     round(
--       count(*) filter (where cta_branch = 'future')::numeric
--       / nullif(count(*) filter (where cta_branch = 'now'), 0), 3
--     ) as future_over_now
--   from public.cta_clicks
--   group by content_id;
--
-- (2) 세션 단위(같은 세션에서 한 번이라도 누른 사람 기준 — 중복 제거)
--   with per_session as (
--     select content_id, session_key,
--            bool_or(cta_branch = 'now')    as clicked_now,
--            bool_or(cta_branch = 'future') as clicked_future
--     from public.cta_clicks
--     where session_key is not null
--     group by content_id, session_key
--   )
--   select content_id,
--          count(*) filter (where clicked_now)    as sessions_now,
--          count(*) filter (where clicked_future) as sessions_future,
--          round(count(*) filter (where clicked_future)::numeric
--                / nullif(count(*) filter (where clicked_now), 0), 3) as future_over_now
--   from per_session
--   group by content_id;
--
-- 실험 1 판정(§6): future_over_now 가 충분히 크고, 미래 CTA 클릭률(미래 클릭/방문)이
--   5%+ 이면 좁게 생존, <2% 이면 가설 사망.
-- =============================================================

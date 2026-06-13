-- ceremony 온보딩 퍼널 계측 (docs/product/ceremony-funnel.md §6~8)
-- 목적: 위저드 단계별 진행·이탈을 본다. 로그인 전 진입이 많으므로 익명 insert 허용.
-- PII 금지 — session_id(랜덤)와 단계 메타(props)만 담는다. 본문/이름/이메일 미전송.

create table if not exists public.funnel_events (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,                 -- 클라이언트 sessionStorage 랜덤 id (사람 식별 아님)
  event       text not null,                 -- cer_view|cer_start|cer_step|cer_complete|cer_signup_click|cer_reco_click
  props       jsonb,                         -- 단계 번호·variant 등 (PII 금지)
  created_at  timestamptz not null default now()
);

create index if not exists funnel_events_event_created_idx on public.funnel_events (event, created_at desc);
create index if not exists funnel_events_session_idx        on public.funnel_events (session_id);
create index if not exists funnel_events_created_idx        on public.funnel_events (created_at desc);

alter table public.funnel_events enable row level security;

-- 익명·로그인 모두 INSERT만 허용 (퍼널은 가입 전 단계를 잡아야 하므로 anon 필요).
drop policy if exists funnel_events_insert_anon on public.funnel_events;
create policy funnel_events_insert_anon on public.funnel_events
  for insert to anon, authenticated
  with check (true);

-- SELECT 정책 없음 = 일반/익명은 조회 불가. 운영 집계는 service_role(SQL Editor/admin)로 RLS 우회.
-- UPDATE/DELETE 정책 없음 = 불변 로그.

-- 리텐션 테스트용 페이지뷰/이벤트 로그
-- 목적: 초대받은 지인들이 "언제 가입 / 어느 페이지 / 며칠 후 재방문"하는지 자동 측정.
-- 쓰기 행동(케어일지·답변·일기 등)은 각 테이블 created_at로 이미 추적되므로,
-- 여기서는 "방문·열람" 신호(클릭 없는 소비)를 보완한다.

create table if not exists public.app_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  event_type  text not null default 'pageview',  -- 'pageview' | (향후 'click' 등 확장)
  path        text,                              -- 예: 'index.html', 'care-dashboard.html'
  meta        jsonb,                             -- referrer 등 부가정보
  created_at  timestamptz not null default now()
);

create index if not exists app_events_user_created_idx on public.app_events (user_id, created_at desc);
create index if not exists app_events_created_idx      on public.app_events (created_at desc);
create index if not exists app_events_path_idx         on public.app_events (path);

alter table public.app_events enable row level security;

-- 로그인 사용자는 본인 이벤트만 INSERT (익명 삽입 차단 = 스팸 방지)
drop policy if exists app_events_insert_own on public.app_events;
create policy app_events_insert_own on public.app_events
  for insert to authenticated
  with check (auth.uid() = user_id);

-- 본인 이벤트만 SELECT. 분석(창업자)은 SQL Editor/service role로 RLS 우회해 전체 조회.
drop policy if exists app_events_select_own on public.app_events;
create policy app_events_select_own on public.app_events
  for select to authenticated
  using (auth.uid() = user_id);

-- UPDATE/DELETE 정책 없음 = 일반 사용자는 로그 수정·삭제 불가 (불변 로그)

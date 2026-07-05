-- ============================================================
-- 묻다 (Mutda) v1 — 사전 죽음준비 콘텐츠·커뮤니티 앱
-- 잇다와 같은 Supabase 프로젝트를 공유하되, 모든 테이블은 mutda_ 접두사로 격리.
-- 기존 잇다 테이블은 건드리지 않는다.
-- ============================================================

-- ------------------------------------------------------------
-- 1) 프로필 + 온보딩 + 안부확인 설정
-- ------------------------------------------------------------
create table if not exists public.mutda_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  birth_year int,
  onboarding jsonb not null default '{}'::jsonb,     -- 온보딩 퀴즈 답 (개인화 소스)
  journey_focus text[] not null default '{}',        -- 개인화된 여정 트랙 키
  has_pet boolean not null default false,
  -- 안부확인 (고독사 방지)
  checkin_enabled boolean not null default false,
  checkin_threshold_hours int not null default 18
    check (checkin_threshold_hours between 6 and 72),
  share_location boolean not null default false,
  last_active_at timestamptz not null default now(), -- 하트비트 (앱 접속)
  last_lat double precision,
  last_lng double precision,
  last_location_at timestamptz,
  -- 조용한 리텐션 (이어온 날들)
  streak_days int not null default 1,
  last_visit_date date default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mutda_profiles enable row level security;

drop policy if exists mutda_profiles_owner on public.mutda_profiles;
create policy mutda_profiles_owner on public.mutda_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2) 보호 연락처 (안부확인 알림을 받을 가족)
-- ------------------------------------------------------------
create table if not exists public.mutda_guardians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relation text,
  phone text,
  email text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.mutda_guardians enable row level security;

drop policy if exists mutda_guardians_owner on public.mutda_guardians;
create policy mutda_guardians_owner on public.mutda_guardians
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists mutda_guardians_user_idx on public.mutda_guardians(user_id);

-- ------------------------------------------------------------
-- 3) 안부확인 알림 로그
--    status: pending(생성) -> notified(발송) -> resolved(사용자 복귀)
-- ------------------------------------------------------------
create table if not exists public.mutda_checkin_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  triggered_at timestamptz not null default now(),
  hours_inactive numeric,
  status text not null default 'pending'
    check (status in ('pending','notified','resolved')),
  notified_at timestamptz,
  resolved_at timestamptz
);

alter table public.mutda_checkin_alerts enable row level security;

-- 본인은 자기 알림을 읽고(내 안부 기록), 복귀 시 resolved로 갱신할 수 있다.
drop policy if exists mutda_checkin_alerts_owner_read on public.mutda_checkin_alerts;
create policy mutda_checkin_alerts_owner_read on public.mutda_checkin_alerts
  for select using (auth.uid() = user_id);

drop policy if exists mutda_checkin_alerts_owner_resolve on public.mutda_checkin_alerts;
create policy mutda_checkin_alerts_owner_resolve on public.mutda_checkin_alerts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists mutda_checkin_alerts_user_idx
  on public.mutda_checkin_alerts(user_id, status);

-- ------------------------------------------------------------
-- 4) 유언장 위저드 — 질문별 답 + 생성된 문서
-- ------------------------------------------------------------
create table if not exists public.mutda_will_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  answer jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_key)
);

alter table public.mutda_will_answers enable row level security;

drop policy if exists mutda_will_answers_owner on public.mutda_will_answers;
create policy mutda_will_answers_owner on public.mutda_will_answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- status: draft(초안) -> handwritten(자필 완료) -> notarized(공증 완료)
create table if not exists public.mutda_wills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  version int not null default 1,
  status text not null default 'draft'
    check (status in ('draft','handwritten','notarized')),
  handwritten_at timestamptz,
  notarized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mutda_wills enable row level security;

drop policy if exists mutda_wills_owner on public.mutda_wills;
create policy mutda_wills_owner on public.mutda_wills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists mutda_wills_user_idx on public.mutda_wills(user_id);

-- ------------------------------------------------------------
-- 5) 편지 — 감사의 말 / 작별인사
-- ------------------------------------------------------------
create table if not exists public.mutda_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('gratitude','farewell')),
  recipient text,
  body text not null default '',
  status text not null default 'draft' check (status in ('draft','done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mutda_letters enable row level security;

drop policy if exists mutda_letters_owner on public.mutda_letters;
create policy mutda_letters_owner on public.mutda_letters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists mutda_letters_user_idx on public.mutda_letters(user_id);

-- ------------------------------------------------------------
-- 6) 유품 정리 — 내 물건 미리 정리
-- ------------------------------------------------------------
create table if not exists public.mutda_belongings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,               -- 귀중품/추억/일상/디지털 등
  decision text not null default 'undecided'
    check (decision in ('give','donate','discard','keep','undecided')),
  recipient text,              -- 물려줄 사람
  note text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.mutda_belongings enable row level security;

drop policy if exists mutda_belongings_owner on public.mutda_belongings;
create policy mutda_belongings_owner on public.mutda_belongings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists mutda_belongings_user_idx on public.mutda_belongings(user_id);

-- ------------------------------------------------------------
-- 7) 반려동물 돌봄 플랜 — 내게 비상상황이 생기면
-- ------------------------------------------------------------
create table if not exists public.mutda_pet_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_name text not null,
  species text,
  age_note text,
  feeding text,                -- 사료/식사 습관
  medical text,                -- 지병/약/알레르기
  vet text,                    -- 주치의(동물병원) 이름·연락처
  caretaker_name text,         -- 비상 돌봄인
  caretaker_contact text,
  caretaker_agreed boolean not null default false, -- 돌봄인 사전 동의 여부
  handover_note text,          -- 인계 메모 (습관·좋아하는 것·주의사항)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mutda_pet_plans enable row level security;

drop policy if exists mutda_pet_plans_owner on public.mutda_pet_plans;
create policy mutda_pet_plans_owner on public.mutda_pet_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists mutda_pet_plans_user_idx on public.mutda_pet_plans(user_id);

-- ------------------------------------------------------------
-- 8) 커뮤니티 — 함께 나누는 이야기 (조용한 톤, 좋아요 수 경쟁 없음)
-- ------------------------------------------------------------
create table if not exists public.mutda_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null default '익명',
  title text,
  body text not null,
  topic text,                  -- will / letter / belongings / pet / life
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.mutda_posts enable row level security;

drop policy if exists mutda_posts_read on public.mutda_posts;
create policy mutda_posts_read on public.mutda_posts
  for select using (true);

drop policy if exists mutda_posts_insert on public.mutda_posts;
create policy mutda_posts_insert on public.mutda_posts
  for insert with check (auth.uid() = user_id);

drop policy if exists mutda_posts_owner_update on public.mutda_posts;
create policy mutda_posts_owner_update on public.mutda_posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists mutda_posts_owner_delete on public.mutda_posts;
create policy mutda_posts_owner_delete on public.mutda_posts
  for delete using (auth.uid() = user_id);

create index if not exists mutda_posts_created_idx on public.mutda_posts(created_at desc);

create table if not exists public.mutda_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.mutda_posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null default '익명',
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.mutda_post_comments enable row level security;

drop policy if exists mutda_post_comments_read on public.mutda_post_comments;
create policy mutda_post_comments_read on public.mutda_post_comments
  for select using (true);

drop policy if exists mutda_post_comments_insert on public.mutda_post_comments;
create policy mutda_post_comments_insert on public.mutda_post_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists mutda_post_comments_owner_delete on public.mutda_post_comments;
create policy mutda_post_comments_owner_delete on public.mutda_post_comments
  for delete using (auth.uid() = user_id);

create index if not exists mutda_post_comments_post_idx
  on public.mutda_post_comments(post_id, created_at);

-- ------------------------------------------------------------
-- 9) 이벤트 로그 (퍼널 측정)
-- ------------------------------------------------------------
create table if not exists public.mutda_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.mutda_events enable row level security;

-- 익명(랜딩)도 기록 가능, 읽기는 서비스 롤만
drop policy if exists mutda_events_insert on public.mutda_events;
create policy mutda_events_insert on public.mutda_events
  for insert with check (user_id is null or auth.uid() = user_id);

-- ------------------------------------------------------------
-- 10) 하트비트 RPC — 클라이언트가 주기 호출 (마지막 활동 갱신 + 알림 자동 해제)
-- ------------------------------------------------------------
create or replace function public.mutda_heartbeat(
  p_lat double precision default null,
  p_lng double precision default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return;
  end if;

  update public.mutda_profiles
     set last_active_at = now(),
         last_lat = coalesce(p_lat, last_lat),
         last_lng = coalesce(p_lng, last_lng),
         last_location_at = case when p_lat is not null then now() else last_location_at end,
         updated_at = now()
   where user_id = auth.uid();

  -- 사용자가 돌아왔으므로 미해결 알림은 자동 해제
  update public.mutda_checkin_alerts
     set status = 'resolved', resolved_at = now()
   where user_id = auth.uid() and status in ('pending','notified');
end;
$$;

grant execute on function public.mutda_heartbeat(double precision, double precision) to authenticated;

-- ------------------------------------------------------------
-- 11) 안부확인 스캔 — pg_cron이 30분마다 실행.
--     임계시간 초과 + 최근 24시간 내 알림 없음 -> pending 알림 생성
-- ------------------------------------------------------------
create or replace function public.mutda_run_checkin_scan()
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_count int := 0;
begin
  insert into public.mutda_checkin_alerts (user_id, hours_inactive)
  select p.user_id,
         round(extract(epoch from (now() - p.last_active_at)) / 3600.0, 1)
    from public.mutda_profiles p
   where p.checkin_enabled
     and p.last_active_at < now() - (p.checkin_threshold_hours || ' hours')::interval
     and exists (select 1 from public.mutda_guardians g where g.user_id = p.user_id)
     and not exists (
           select 1 from public.mutda_checkin_alerts a
            where a.user_id = p.user_id
              and a.status in ('pending','notified')
       )
     and not exists (
           select 1 from public.mutda_checkin_alerts a
            where a.user_id = p.user_id
              and a.triggered_at > now() - interval '24 hours'
       );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- pg_cron + pg_net 활성화 후 스케줄 등록 (이미 있으면 갱신)
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('mutda-checkin-scan');
exception when others then
  null; -- 처음 실행이면 잡이 없어 실패 -> 무시
end;
$$;

select cron.schedule(
  'mutda-checkin-scan',
  '*/30 * * * *',
  $$select public.mutda_run_checkin_scan()$$
);

-- pending 알림을 Edge Function(mutda-checkin-notify)으로 전달해 이메일 발송.
-- Edge Function 쪽에서 service role로 알림을 읽고 notified 처리한다.
do $$
begin
  perform cron.unschedule('mutda-checkin-notify');
exception when others then
  null;
end;
$$;

select cron.schedule(
  'mutda-checkin-notify',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://zugwccngzprjjnwtajyr.supabase.co/functions/v1/mutda-checkin-notify',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"source": "pg_cron"}'::jsonb
  )
  $$
);

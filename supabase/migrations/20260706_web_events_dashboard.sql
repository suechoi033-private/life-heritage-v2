-- 통합 웹 트래킹 + 라이브 대시보드 집계 RPC (dash.html)
-- 목적: 잇다·묻다·개인홈(suechoi) 3개 프로퍼티를 같은 값으로 보는 대시보드.
--   1) web_events — 익명 포함 전 방문 로그 (유입경로 ref/utm 수집; js/track.js가 기록)
--   2) dash_* RPC — 운영자 전용 집계 (RLS 우회는 SECURITY DEFINER + 이메일 확인)
-- PII 최소화: web_events에 이름·이메일 없음. vid/sid는 랜덤 식별자.

-- ── 1. web_events ─────────────────────────────────────────────
create table if not exists public.web_events (
  id          uuid primary key default gen_random_uuid(),
  site        text not null,                  -- 'itda' | 'mutda' | 'suechoi'
  event       text not null default 'pageview',
  path        text,
  vid         text,                           -- 방문자 id (localStorage, 랜덤)
  sid         text,                           -- 세션 id (sessionStorage, 랜덤)
  user_id     uuid,                           -- 로그인 상태면 채움 (분석용, FK 없음 — 익명성 유지)
  ref         text,                           -- document.referrer 원문
  ref_host    text,                           -- referrer 호스트만
  utm         jsonb,                          -- {source, medium, campaign}
  meta        jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists web_events_site_created_idx on public.web_events (site, created_at desc);
create index if not exists web_events_path_idx         on public.web_events (site, path);
create index if not exists web_events_ref_idx          on public.web_events (ref_host);

alter table public.web_events enable row level security;

-- 익명·로그인 모두 INSERT만 (가입 전 유입을 잡아야 하므로 anon 필요). SELECT/UPDATE/DELETE 정책 없음 = 불변 로그.
drop policy if exists web_events_insert_any on public.web_events;
create policy web_events_insert_any on public.web_events
  for insert to anon, authenticated with check (true);

-- ── 2. 운영자 가드 ─────────────────────────────────────────────
create or replace function public.dash_guard() returns void
language plpgsql as $$
begin
  if coalesce((auth.jwt() ->> 'email'), '') <> 'sue.choi033@gmail.com' then
    raise exception 'forbidden';
  end if;
end $$;

-- ── 3. 일별 트래픽 (사이트별 방문자·PV) ────────────────────────
-- 이중 집계 방지: 잇다/묻다 회원 방문은 app_events/mutda_events로 세고,
-- web_events에서는 익명(user_id null)만 합산. suechoi는 web_events가 유일 소스.
create or replace function public.dash_overview(days int default 14)
returns table(day date, site text, visitors bigint, pv bigint)
language plpgsql security definer set search_path = public as $$
begin
  perform dash_guard();
  return query
  with ev as (
    select 'itda'::text as s, a.created_at, 'u:'||a.user_id::text as visitor
      from app_events a where a.event_type = 'pageview'
    union all
    select 'mutda', m.created_at, 'u:'||coalesce(m.user_id::text,'anon')
      from mutda_events m where m.event like '%\_view' escape '\'
    union all
    select w.site, w.created_at, coalesce('v:'||w.vid, 's:'||w.sid, 'x')
      from web_events w
      where w.event = 'pageview' and (w.user_id is null or w.site not in ('itda','mutda'))
  )
  select (e.created_at at time zone 'Asia/Seoul')::date, e.s,
         count(distinct e.visitor), count(*)
  from ev e
  where e.created_at > now() - make_interval(days => days)
  group by 1, 2;
end $$;

-- ── 4. 페이지별 도달 (고유 방문자·PV) ──────────────────────────
create or replace function public.dash_pages(days int default 30)
returns table(site text, path text, visitors bigint, pv bigint)
language plpgsql security definer set search_path = public as $$
begin
  perform dash_guard();
  return query
  with ev as (
    select 'itda'::text as s, a.path as p, 'u:'||a.user_id::text as visitor, a.created_at
      from app_events a where a.event_type = 'pageview'
    union all
    select 'mutda', coalesce(m.meta->>'page', m.event), 'u:'||coalesce(m.user_id::text,'anon'), m.created_at
      from mutda_events m where m.event like '%\_view' escape '\'
    union all
    select w.site, w.path, coalesce('v:'||w.vid, 's:'||w.sid, 'x'), w.created_at
      from web_events w
      where w.event = 'pageview' and (w.user_id is null or w.site not in ('itda','mutda'))
  )
  select e.s, coalesce(e.p, '(없음)'), count(distinct e.visitor), count(*)
  from ev e
  where e.created_at > now() - make_interval(days => days)
  group by 1, 2
  order by 4 desc;
end $$;

-- ── 5. 유입 경로 (referrer 호스트 + UTM) ───────────────────────
create or replace function public.dash_sources(days int default 30)
returns table(site text, ref_host text, utm_source text, visitors bigint, hits bigint)
language plpgsql security definer set search_path = public as $$
begin
  perform dash_guard();
  return query
  with src as (
    select w.site as s, w.ref_host as rh, w.utm->>'source' as us,
           coalesce('v:'||w.vid, 's:'||w.sid, 'x') as visitor
    from web_events w
    where w.event = 'pageview' and w.created_at > now() - make_interval(days => days)
    union all
    -- 잇다 회원 방문의 과거 referrer (app_events.meta.ref, 6/5~)
    select 'itda', substring(a.meta->>'ref' from '^[a-z]+://([^/]+)'), null,
           'u:'||a.user_id::text
    from app_events a
    where a.event_type = 'pageview' and coalesce(a.meta->>'ref','') <> ''
      and a.created_at > now() - make_interval(days => days)
  )
  select src.s, src.rh, src.us, count(distinct src.visitor), count(*)
  from src group by 1, 2, 3
  order by 5 desc;
end $$;

-- ── 6. 주간 가입 코호트 리텐션율 (D1+ / D7+) ───────────────────
create or replace function public.dash_retention()
returns table(brand text, cohort_week date, cohort_size bigint, ret_d1 bigint, ret_d7 bigint)
language plpgsql security definer set search_path = public as $$
begin
  perform dash_guard();
  return query
  -- 잇다: 활동 = 페이지뷰 + 쓰기 4종 (리텐션 리포트와 동일 정의)
  with iact as (
    select user_id, created_at from app_events
    union all select user_id, created_at from care_logs
    union all select user_id, created_at from daily_answers
    union all select user_id, created_at from diary_entries
    union all select user_id, created_at from community_posts
  ),
  ippl as (
    select p.id, p.created_at from profiles p
    where p.email not ilike '%@itda.net' and p.email <> 'sue.choi033@gmail.com'
  ),
  ir as (
    select date_trunc('week', p.created_at at time zone 'Asia/Seoul')::date as wk,
      exists (select 1 from iact a where a.user_id = p.id
        and (a.created_at at time zone 'Asia/Seoul')::date > (p.created_at at time zone 'Asia/Seoul')::date) as d1,
      exists (select 1 from iact a where a.user_id = p.id
        and a.created_at >= p.created_at + interval '7 days') as d7
    from ippl p
  )
  select 'itda'::text, ir.wk, count(*), count(*) filter (where ir.d1), count(*) filter (where ir.d7)
  from ir group by 2
  union all
  -- 묻다: 활동 = mutda_events 전체
  (with mr as (
    select date_trunc('week', p.created_at at time zone 'Asia/Seoul')::date as wk,
      exists (select 1 from mutda_events e where e.user_id = p.user_id
        and (e.created_at at time zone 'Asia/Seoul')::date > (p.created_at at time zone 'Asia/Seoul')::date) as d1,
      exists (select 1 from mutda_events e where e.user_id = p.user_id
        and e.created_at >= p.created_at + interval '7 days') as d7
    from mutda_profiles p
  )
  select 'mutda'::text, mr.wk, count(*), count(*) filter (where mr.d1), count(*) filter (where mr.d7)
  from mr group by 2)
  order by 1, 2 desc;
end $$;

-- ── 7. 묻다 Q3 목표 실측치 (goal-2026q3.md 8지표) ──────────────
create or replace function public.dash_goals()
returns table(
  mutda_signups bigint, dau_today bigint, wau bigint,
  d7_eligible bigint, d7_retained bigint,
  letters_sent bigint, checkin_on bigint, guardian_linked bigint, will_users bigint,
  itda_signups bigint
)
language plpgsql security definer set search_path = public as $$
begin
  perform dash_guard();
  return query select
    (select count(*) from mutda_profiles),
    (select count(distinct e.user_id) from mutda_events e
      where (e.created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date),
    (select count(distinct e.user_id) from mutda_events e
      where e.created_at > now() - interval '7 days'),
    (select count(*) from mutda_profiles p where p.created_at <= now() - interval '7 days'),
    (select count(*) from mutda_profiles p where p.created_at <= now() - interval '7 days'
      and exists (select 1 from mutda_events e where e.user_id = p.user_id
                  and e.created_at >= p.created_at + interval '7 days')),
    (select count(*) from mutda_letters l where l.sent_at is not null or l.status = 'sent'),
    (select count(*) from mutda_profiles p where p.checkin_enabled),
    (select count(*) from mutda_profiles p where exists
      (select 1 from mutda_guardians g where g.user_id = p.user_id and g.guardian_user_id is not null)),
    (select count(distinct w.user_id) from mutda_wills w),
    (select count(*) from profiles p
      where p.email not ilike '%@itda.net' and p.email <> 'sue.choi033@gmail.com');
end $$;

-- ── 권한 ──────────────────────────────────────────────────────
revoke all on function public.dash_guard()          from public, anon;
revoke all on function public.dash_overview(int)    from public, anon;
revoke all on function public.dash_pages(int)       from public, anon;
revoke all on function public.dash_sources(int)     from public, anon;
revoke all on function public.dash_retention()      from public, anon;
revoke all on function public.dash_goals()          from public, anon;
grant execute on function public.dash_overview(int) to authenticated;
grant execute on function public.dash_pages(int)    to authenticated;
grant execute on function public.dash_sources(int)  to authenticated;
grant execute on function public.dash_retention()   to authenticated;
grant execute on function public.dash_goals()       to authenticated;

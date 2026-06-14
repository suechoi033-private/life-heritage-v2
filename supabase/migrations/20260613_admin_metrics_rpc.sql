-- admin.html 측정 대시보드용 집계 RPC (운영자 전용).
-- funnel_events / app_events 는 RLS로 타인 데이터 조회가 막혀 있으므로,
-- 운영자 이메일을 확인하는 SECURITY DEFINER 함수로만 '집계값'을 돌려준다(원본 행 미노출).

-- ── 퍼널 단계별 요약 ──────────────────────────────
create or replace function public.admin_funnel_summary(days int default 30)
returns table(event text, sessions bigint, events bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((auth.jwt() ->> 'email'), '') <> 'sue.choi033@gmail.com' then
    raise exception 'forbidden';
  end if;
  return query
    select e.event,
           count(distinct e.session_id) as sessions,
           count(*)                     as events
    from public.funnel_events e
    where e.created_at > now() - make_interval(days => days)
    group by e.event;
end;
$$;

-- ── 콘텐츠 정독 요약 ──────────────────────────────
create or replace function public.admin_content_read_summary(days int default 30)
returns table(category text, content_id text, reads bigint, completes bigint, avg_scroll numeric, avg_dwell numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((auth.jwt() ->> 'email'), '') <> 'sue.choi033@gmail.com' then
    raise exception 'forbidden';
  end if;
  return query
    select (a.meta->>'category')                                   as category,
           (a.meta->>'contentId')                                  as content_id,
           count(*)                                                as reads,
           count(*) filter (where (a.meta->>'reachedEnd')::bool)   as completes,
           round(avg((a.meta->>'maxScrollPct')::numeric))          as avg_scroll,
           round(avg((a.meta->>'dwellSec')::numeric))              as avg_dwell
    from public.app_events a
    where a.event_type = 'content_read'
      and a.created_at > now() - make_interval(days => days)
    group by 1, 2
    order by reads desc;
end;
$$;

revoke all on function public.admin_funnel_summary(int) from public, anon;
revoke all on function public.admin_content_read_summary(int) from public, anon;
grant execute on function public.admin_funnel_summary(int) to authenticated;
grant execute on function public.admin_content_read_summary(int) to authenticated;

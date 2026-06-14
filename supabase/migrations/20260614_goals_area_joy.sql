-- =============================================================
-- goals.area 에 'joy'(사소한 기쁨) 추가 — 사장님 결정 D3 (2026-06-14)
--
-- 단일 원천: docs/strategy/decisions-2026-06-14.md
--
-- 배경: 현재 goals.area 는 text + CHECK ('finance','health','family','growth') 4개.
--       Axis B(나를 위한 풍요로운 삶 / 사소한 기쁨)의 항목이 들어갈 영역 추가.
--
-- 데이터 안전:
--   - 기존 goals 행 영향 0 (CHECK 제약 확장만, 기존 값은 그대로 유효).
--   - reversible (mid-grade one-way — 'joy' 행이 들어가기 시작하면 enum 축소 시 데이터 정리 필요).
--
-- 사장님 액션: Supabase SQL Editor에서 본 파일 1회 실행.
-- =============================================================

begin;

-- 기존 CHECK 제약 이름은 자동 생성됨(보통 goals_area_check).
-- pg_catalog로 동적 찾아 drop 후 재생성 — 멱등 안전.
do $$
declare
  v_constraint text;
begin
  select conname into v_constraint
    from pg_constraint
   where conrelid = 'public.goals'::regclass
     and contype  = 'c'
     and pg_get_constraintdef(oid) ilike '%area%'
     and pg_get_constraintdef(oid) ilike '%finance%';
  if v_constraint is not null then
    execute format('alter table public.goals drop constraint %I', v_constraint);
  end if;
end
$$;

alter table public.goals
  add constraint goals_area_check
  check (area in ('finance','health','family','growth','joy'));

commit;

-- =============================================================
-- 자기성찰 시리즈 — Axis A·B 진입 (사장님 결정 2026-06-14, D1 우회)
--
-- 단일 원천: docs/strategy/decisions-2026-06-14.md
-- 단일 원천: docs/strategy/product-axis-not-waking-tomorrow-2026-06-14.md
--
-- 사장님 결정 D1: 새 important_people 테이블 신설 X
--   → 기존 daily_questions + daily_answers 활용으로 우회.
--
-- 본 마이그레이션이 하는 일:
--   (1) daily_questions 에 series_key(text) / series_step(int) / series_branch(text) 컬럼 추가
--       - 일반 "오늘 잇고" 질문은 series_key = NULL (영향 0)
--       - 시리즈 질문은 series_key = 'not_waking_tomorrow', series_step = 1..5
--       - 분기 질문은 series_branch = 'person' 또는 'work' (Q1·Q2는 NULL = 공통)
--   (2) 시리즈 8개 질문 멱등 INSERT (Q1·Q2 공통 + Q3a/4a/5a 사람 + Q3b/4b/5b 일)
--       - display_order 는 NULL (가입 N일째 매핑에서 제외)
--       - answer_kind = 'text' (자유 서술)
--
-- 데이터 안전:
--   - 기존 daily_questions 행 변경 0건.
--   - 기존 daily_answers 행 변경 0건.
--   - get_todays_question RPC 영향 0 (NULL display_order는 매칭 안 됨).
--   - 모든 변경 reversible (컬럼 추가만, 데이터 삭제 0).
--
-- 사장님 액션: Supabase SQL Editor에서 본 파일 1회 실행.
-- =============================================================

begin;

-- ============================================================
-- 1) daily_questions 컬럼 보강 (시리즈 식별자)
-- ============================================================
alter table public.daily_questions
  add column if not exists series_key    text,
  add column if not exists series_step   int,
  add column if not exists series_branch text
    check (series_branch is null or series_branch in ('person','work'));

-- 시리즈 조회용 인덱스 (NULL은 제외 → 일반 질문 영향 0)
create index if not exists daily_questions_series_idx
  on public.daily_questions (series_key, series_step)
  where series_key is not null;

-- ============================================================
-- 2) 자기성찰 시리즈 — 'not_waking_tomorrow' 8문항 멱등 INSERT
--
-- 흐름:
--   Step 1 (공통): "내일 다시 못 깨어난다면, 가장 후회할 일은?" — 사장님 확정 카피
--   Step 2 (공통): "그 답에서 떠오른 건 — 사람인가요, 하고 싶은 일인가요?" 분기
--   사람 path: Step 3a → 4a → 5a
--   일 path:   Step 3b → 4b → 5b
-- ============================================================
insert into public.daily_questions
  (category, question_text, display_order, answer_kind,
   series_key, series_step, series_branch, seed_answers)
select v.category, v.question_text, null, 'text',
       v.series_key, v.series_step, v.series_branch, '[]'::jsonb
from (values
  -- Step 1 (공통) — 사장님 확정 카피 (변경 금지)
  ('endings',      '내일 다시 못 깨어난다면, 가장 후회할 일은?',
   'not_waking_tomorrow', 1, null::text),

  -- Step 2 (공통) — 사람/일 분기
  ('self',         '그 답에서 떠오른 건 — 사람인가요, 하고 싶은 일인가요?',
   'not_waking_tomorrow', 2, null::text),

  -- 사람 path
  ('relationships','떠오른 그 사람은 누구인가요? (이름이나 관계를 적어주세요)',
   'not_waking_tomorrow', 3, 'person'),
  ('relationships','주 몇 번 연락하시고 싶으세요? (주 1회 · 주 2회 · 주 3회)',
   'not_waking_tomorrow', 4, 'person'),
  ('relationships','정한 빈도에 맞춰 잔잔한 알람을 드릴까요? (예 / 아니오)',
   'not_waking_tomorrow', 5, 'person'),

  -- 일 path
  ('self',         '내가 원하는 풍요로운 삶 — 어떤 모습인가요?',
   'not_waking_tomorrow', 3, 'work'),
  ('self',         '이번 주에 하나 골라보실래요? (떠올린 것 중에서)',
   'not_waking_tomorrow', 4, 'work'),
  ('self',         '이 약속에 맞춰 잔잔한 알람을 드릴까요? (예 / 아니오)',
   'not_waking_tomorrow', 5, 'work')
) as v(category, question_text, series_key, series_step, series_branch)
where not exists (
  select 1 from public.daily_questions d
   where d.series_key  = v.series_key
     and d.series_step = v.series_step
     and coalesce(d.series_branch, '') = coalesce(v.series_branch, '')
);

commit;

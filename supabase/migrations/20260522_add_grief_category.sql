-- =============================================================
-- contents.category 에 'grief'(사별) 추가
-- 사별 직후(lifecycle 2) 콘텐츠 전용 카테고리. memorial(추모)와 별개.
-- =============================================================

alter table public.contents drop constraint if exists contents_category_check;

alter table public.contents add constraint contents_category_check
  check (category in ('finance', 'health', 'family', 'grief', 'death_prep', 'memorial', 'reflection'));

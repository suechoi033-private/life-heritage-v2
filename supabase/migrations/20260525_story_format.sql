-- =============================================================
-- 이야기 카드 (롱폼 여정 콘텐츠) 포맷
--   오늘의집 '집들이'의 잇다 버전 — 한 사람이 한 lifecycle 단계를
--   통과한 1인칭 롱폼 여정(에세이 + 체크리스트 + 도구 CTA).
--
-- contents 테이블에 story 포맷 필드 추가. 기존 글은 모두 'article'.
-- 20260517_redesign_mvp.sql 이후 실행.
-- =============================================================

alter table public.contents
  add column if not exists format text not null default 'article'
    check (format in ('article', 'story')),
  add column if not exists cover_image_url text,
  add column if not exists excerpt text,          -- 한 줄 발췌(피드/hero 노출)
  add column if not exists checklist jsonb,        -- [{ "text": "...", "url": "선택" }]
  add column if not exists cta_label text,         -- 도구 CTA 버튼 문구
  add column if not exists cta_url text;           -- 도구 CTA 링크

-- 홈 hero: 최신 발행 story를 빠르게 찾기 위한 인덱스
create index if not exists contents_story_idx
  on public.contents (format, is_published, created_at desc);

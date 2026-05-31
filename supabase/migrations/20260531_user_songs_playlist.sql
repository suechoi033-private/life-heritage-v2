-- =============================================================
-- user_songs 확장 — '한 곡'에서 '플레이리스트'로
-- 기존: user당 kind별 1행(unique) → 1곡만 저장 가능
-- 변경: user당 kind별 여러 곡 + 정렬용 position 컬럼
-- 기존 행은 그대로 유지(position=0) → 첫 곡으로 자연 편입
-- =============================================================

alter table public.user_songs drop constraint if exists user_songs_user_id_kind_key;
alter table public.user_songs add column if not exists position int not null default 0;
create index if not exists user_songs_user_kind_pos on public.user_songs (user_id, kind, position, created_at);

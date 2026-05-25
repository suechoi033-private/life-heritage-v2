-- =============================================================
-- 카드 인라인 댓글(콘텐츠 직접 댓글) + 홈 피드 실시간 갱신
--
-- 1) comments가 콘텐츠를 직접 타겟할 수 있게 content_id 추가
--    (기존 comments는 community_posts(post_id) 타겟 — 유지)
-- 2) 홈 실시간 갱신을 위해 contents/reactions/comments를
--    supabase_realtime publication에 추가
-- 20260517_redesign_mvp.sql 이후 실행.
-- =============================================================

-- 1) comments: 콘텐츠 직접 댓글 지원
alter table public.comments
  add column if not exists content_id uuid references public.contents(id) on delete cascade;

alter table public.comments alter column post_id drop not null;

-- post_id 또는 content_id 중 정확히 하나만 (기존 행은 post_id만 → 통과)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'comments_target_chk'
  ) then
    alter table public.comments
      add constraint comments_target_chk
      check ((post_id is not null) <> (content_id is not null));
  end if;
end $$;

create index if not exists comments_content_idx
  on public.comments (content_id, created_at) where content_id is not null;

-- 2) 실시간 publication 등록 (이미 등록돼 있으면 건너뜀)
do $$
declare t text;
begin
  foreach t in array array['contents','reactions','comments'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
exception when undefined_object then
  -- supabase_realtime publication이 없으면 무시(로컬/특수 환경)
  null;
end $$;

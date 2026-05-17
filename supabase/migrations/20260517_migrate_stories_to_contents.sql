-- =============================================================
-- 기존 stories(기억·이야기) → 새 contents(숲 탭 추모 카테고리)
-- 별도 실행 권장: 1번 마이그레이션 후 운영 데이터 점검 후 실행
-- =============================================================

-- 1) stories → contents 이전 (중복 방지: 이미 옮긴 경우 스킵)
insert into public.contents (
  id, category, title, body, content_type,
  author_type, creator_id,
  memorial_meta,
  is_published, created_at, updated_at
)
select
  s.id,
  'memorial' as category,
  coalesce(s.title, '추모') as title,
  s.body,
  'text' as content_type,
  'user' as author_type,
  s.user_id as creator_id,
  jsonb_strip_nulls(jsonb_build_object(
    'relation', s.relation,
    'writer_relation', s.writer_relation,
    'age', s.age,
    'death_year', s.death_year,
    'cause', s.cause,
    'duration', s.duration,
    'last_place', s.last_place,
    'funeral', s.funeral,
    'visibility', s.visibility,
    'ai_generated', s.ai_generated,
    'draft_memo', s.draft_memo
  )) as memorial_meta,
  case when coalesce(s.visibility, 'private') in ('public', 'community') then true else false end as is_published,
  s.created_at,
  coalesce(s.updated_at, s.created_at) as updated_at
from public.stories s
where not exists (select 1 from public.contents c where c.id = s.id);

-- 2) story_photos → content_media
insert into public.content_media (content_id, storage_path, media_type, sort_order)
select sp.story_id, sp.storage_path, 'image', coalesce(sp.sort_order, 0)
from public.story_photos sp
where exists (select 1 from public.contents c where c.id = sp.story_id)
  and not exists (
    select 1 from public.content_media cm
    where cm.content_id = sp.story_id and cm.storage_path = sp.storage_path
  );

-- 3) 기존 flowers(반응) → reactions로 통합
insert into public.reactions (target_type, target_id, user_id, reaction_type, created_at)
select 'content', f.story_id, f.user_id, 'flower', f.created_at
from public.flowers f
where exists (select 1 from public.contents c where c.id = f.story_id)
  and not exists (
    select 1 from public.reactions r
    where r.target_type = 'content' and r.target_id = f.story_id
      and r.user_id = f.user_id and r.reaction_type = 'flower'
  )
on conflict do nothing;

-- 마이그레이션 검증 쿼리 (실행해서 카운트 일치 확인)
-- select count(*) from public.stories;
-- select count(*) from public.contents where category = 'memorial';
-- select count(*) from public.story_photos;
-- select count(*) from public.content_media;

-- 안전 확인 후 다음 단계 (별도 실행):
-- drop view if exists public.stories_legacy;
-- alter table public.stories rename to stories_legacy_archive;

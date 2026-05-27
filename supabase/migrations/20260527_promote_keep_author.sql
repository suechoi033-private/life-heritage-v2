-- =============================================================
-- 승급(promote) 시 원작자 보존
-- 기존: 커뮤니티 글을 공식 콘텐츠로 승급하면 author_type='official',
--       creator_id=관리자 로 저장돼 홈 피드에서 작성자가 "잇다 에디터"로 표기됨.
-- 변경: 원작자를 그대로 살린다 → author_type='user', creator_id=원글 작성자.
--       (승급 사실은 promoted_by/promoted_at/promoted_from_post_id로 계속 기록)
-- =============================================================

create or replace function public.admin_promote_post_to_content(
  p_post_id  uuid,
  p_category text default null,
  p_title    text default null,
  p_body     text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post     record;
  v_board    record;
  v_category text;
  v_admin_id uuid;
  v_new_id   uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select * into v_post from public.community_posts where id = p_post_id;
  if v_post is null then
    raise exception 'post not found';
  end if;
  if v_post.content_thread_id is not null then
    raise exception 'already promoted';
  end if;

  select * into v_board from public.boards where id = v_post.board_id;

  v_category := coalesce(p_category, case v_board.slug
    when 'parent-care' then 'family'
    when 'retirement'  then 'finance'
    when 'end-of-life' then 'death_prep'
    when 'reflection'  then 'reflection'
    when 'memorial'    then 'memorial'
    else 'reflection'
  end);

  v_admin_id := auth.uid();

  insert into public.contents (
    category, title, body, content_type,
    author_type, creator_id,
    promoted_from_post_id, promoted_at, promoted_by,
    is_published
  ) values (
    v_category,
    coalesce(p_title, v_post.title),
    coalesce(p_body,  v_post.body),
    'text',
    'user',            -- 원작자 글 → 'user' (홈에서 실제 작성자로 표기)
    v_post.user_id,    -- 원글 작성자 보존 (관리자가 아님)
    v_post.id,
    now(),
    v_admin_id,        -- 승급 주체(관리자)는 별도로 기록
    true
  ) returning id into v_new_id;

  update public.community_posts
  set content_thread_id = v_new_id, updated_at = now()
  where id = p_post_id;

  return v_new_id;
end $$;

grant execute on function public.admin_promote_post_to_content(uuid, text, text, text) to authenticated;

-- 이미 승급된 콘텐츠 백필: 관리자로 잘못 기록된 작성자를 원글 작성자로 교정
update public.contents c
set creator_id = p.user_id,
    author_type = 'user'
from public.community_posts p
where c.promoted_from_post_id = p.id
  and c.author_type <> 'user';

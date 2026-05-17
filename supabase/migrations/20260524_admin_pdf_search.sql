-- =============================================================
-- 2026-05-24 — Admin RPC + 책자/검색 지원
--
-- 1. is_admin() 헬퍼 — 어드민 이메일 확정
-- 2. admin_hide_post / admin_unhide_post — 게시글 강제 숨김
-- 3. admin_hide_comment / admin_unhide_comment — 댓글 강제 숨김
-- 4. admin_promote_post_to_content — 커뮤니티 글을 공식 콘텐츠로 승급
-- 5. admin_resolve_report — 신고 처리(상태 변경)
-- 6. admin_users_overview() — 어드민 가입자 풀 뷰 (이메일/이름/카운트)
--
-- 모두 SECURITY DEFINER이며 내부에서 is_admin() 체크.
-- =============================================================

-- =============================================================
-- 1. is_admin() 헬퍼
-- =============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() ->> 'email') = 'sue.choi033@gmail.com', false);
$$;

grant execute on function public.is_admin() to authenticated;

-- =============================================================
-- 2. 게시글 강제 숨김 / 복구
-- =============================================================
create or replace function public.admin_hide_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  update public.community_posts
  set is_deleted = true, updated_at = now()
  where id = p_post_id;
end $$;

create or replace function public.admin_unhide_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  update public.community_posts
  set is_deleted = false, updated_at = now()
  where id = p_post_id;
end $$;

grant execute on function public.admin_hide_post(uuid) to authenticated;
grant execute on function public.admin_unhide_post(uuid) to authenticated;

-- =============================================================
-- 3. 댓글 강제 숨김 / 복구
-- =============================================================
create or replace function public.admin_hide_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  update public.comments
  set is_deleted = true, updated_at = now()
  where id = p_comment_id;
end $$;

create or replace function public.admin_unhide_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  update public.comments
  set is_deleted = false, updated_at = now()
  where id = p_comment_id;
end $$;

grant execute on function public.admin_hide_comment(uuid) to authenticated;
grant execute on function public.admin_unhide_comment(uuid) to authenticated;

-- =============================================================
-- 4. 커뮤니티 글 → 공식 콘텐츠 승급
--   - 새 contents row 생성 (author_type='official')
--   - creator_id = 어드민 (RLS 우회 위해)
--   - promoted_from_post_id = 원본 post.id
--   - community_posts.content_thread_id ← 새 콘텐츠 id (역링크)
--
--   카테고리 매핑: board.slug → contents.category
--     parent-care → family / retirement → finance
--     end-of-life → death_prep / reflection → reflection
--     memorial → memorial / free → reflection (기본)
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
    'official',
    v_admin_id,
    v_post.id,
    now(),
    v_admin_id,
    true
  ) returning id into v_new_id;

  update public.community_posts
  set content_thread_id = v_new_id, updated_at = now()
  where id = p_post_id;

  return v_new_id;
end $$;

grant execute on function public.admin_promote_post_to_content(uuid, text, text, text) to authenticated;

-- =============================================================
-- 5. 신고 처리 — 상태 변경 + handled_by/at 기록
-- =============================================================
create or replace function public.admin_resolve_report(
  p_report_id uuid,
  p_status    text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_status not in ('reviewing', 'resolved', 'dismissed', 'pending') then
    raise exception 'invalid status';
  end if;
  update public.reports
  set status = p_status,
      handled_by = auth.uid(),
      handled_at = now()
  where id = p_report_id;
end $$;

grant execute on function public.admin_resolve_report(uuid, text) to authenticated;

-- =============================================================
-- 6. 어드민 신고함 조회 (RLS 우회 — 어드민만 전체 조회)
-- =============================================================
create or replace function public.admin_list_reports(p_status text default null)
returns table (
  id           uuid,
  target_type  text,
  target_id    uuid,
  reporter_id  uuid,
  reporter_name text,
  reporter_email text,
  reason       text,
  detail       text,
  status       text,
  created_at   timestamptz,
  handled_at   timestamptz,
  target_preview text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  return query
  select
    r.id, r.target_type, r.target_id,
    r.reporter_id, p.name, p.email,
    r.reason, r.detail, r.status,
    r.created_at, r.handled_at,
    case r.target_type
      when 'post'    then (select left(coalesce(cp.title, cp.body, ''), 80)
                           from public.community_posts cp where cp.id = r.target_id)
      when 'comment' then (select left(coalesce(c.body, ''), 80)
                           from public.comments c where c.id = r.target_id)
      when 'content' then (select left(coalesce(co.title, ''), 80)
                           from public.contents co where co.id = r.target_id)
      when 'profile' then (select coalesce(pr.name, pr.email)
                           from public.profiles pr where pr.id = r.target_id)
      else null
    end as target_preview
  from public.reports r
  left join public.profiles p on p.id = r.reporter_id
  where (p_status is null or r.status = p_status)
  order by r.created_at desc;
end $$;

grant execute on function public.admin_list_reports(text) to authenticated;

-- =============================================================
-- 7. 어드민 — 콘텐츠 승급 큐 (포함되지 않은 게시글, 반응 많은 순)
-- =============================================================
create or replace function public.admin_promotion_candidates(p_limit int default 50)
returns table (
  id              uuid,
  title           text,
  body            text,
  user_id         uuid,
  user_name       text,
  board_id        int,
  board_slug      text,
  board_name      text,
  reaction_count  int,
  comment_count   int,
  view_count      int,
  created_at      timestamptz,
  is_promoted     boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  return query
  select
    cp.id, cp.title, cp.body,
    cp.user_id, pr.name,
    cp.board_id, b.slug, b.name,
    cp.reaction_count, cp.comment_count, cp.view_count,
    cp.created_at,
    cp.content_thread_id is not null as is_promoted
  from public.community_posts cp
  left join public.profiles pr on pr.id = cp.user_id
  left join public.boards b on b.id = cp.board_id
  where cp.is_deleted = false
  order by
    case when cp.content_thread_id is null then 0 else 1 end,
    cp.reaction_count desc,
    cp.comment_count desc,
    cp.created_at desc
  limit p_limit;
end $$;

grant execute on function public.admin_promotion_candidates(int) to authenticated;

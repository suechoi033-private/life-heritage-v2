-- =============================================================
-- 잇다 v3 재설계 마이그레이션
-- MVP + 높음 우선순위 기능을 위한 스키마
--
-- 5탭 IA: 홈 / 씨앗(일기·계획) / 둥지(케어링) / 숲(콘텐츠·커뮤니티·추모) / 뿌리(마이)
--
-- 기존 테이블(profiles, care_*, daily_questions/answers, stories)은 유지
-- 신규: 일기, 태그, 친구, 목표/계획, 콘텐츠 허브, 커뮤니티
-- =============================================================

-- =============================================================
-- 0a. 필수 확장 (다른 모든 객체보다 먼저)
-- =============================================================
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- =============================================================
-- 0b. profiles 확장 (소셜 로그인 + 프로필)
-- =============================================================
alter table public.profiles
  add column if not exists auth_provider text default 'email'
    check (auth_provider in ('email', 'kakao', 'google', 'apple')),
  add column if not exists provider_user_id text,
  add column if not exists social_profile jsonb,
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists notification_pref jsonb default '{}'::jsonb;

create unique index if not exists profiles_provider_uid_uniq
  on public.profiles (auth_provider, provider_user_id)
  where provider_user_id is not null;

-- =============================================================
-- 0c. care_logs 컬럼 보강 (v3 신규 기능 — 대시보드·응급 SOS용)
-- 기존 데이터는 NULL로 채워짐, 신규 기록부터 값 입력
-- =============================================================
alter table public.care_logs
  add column if not exists mood text,
  add column if not exists user_id uuid references public.profiles(id);

-- =============================================================
-- 1. 태그 시스템 (공용: 일기·커뮤니티 양쪽 사용)
-- =============================================================
create table if not exists public.tags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  tag_type    text not null check (tag_type in ('keyword', 'emotion')),
  is_favorite boolean default false,
  created_at  timestamptz default now(),
  unique (user_id, tag_type, name)
);

create index if not exists tags_user_type_idx on public.tags (user_id, tag_type);

alter table public.tags enable row level security;

create policy "tags_owner_all" on public.tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- 2. 친구 시스템 (1.6 친구보기 + 친구 초대)
-- =============================================================
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  friend_id    uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending'
    check (status in ('pending', 'accepted', 'blocked')),
  initiated_by uuid references public.profiles(id),
  created_at   timestamptz default now(),
  accepted_at  timestamptz,
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

create index if not exists friendships_user_idx on public.friendships (user_id, status);
create index if not exists friendships_friend_idx on public.friendships (friend_id, status);

alter table public.friendships enable row level security;

create policy "friendships_self_select" on public.friendships
  for select using (auth.uid() in (user_id, friend_id));

create policy "friendships_self_insert" on public.friendships
  for insert with check (auth.uid() = user_id);

create policy "friendships_self_update" on public.friendships
  for update using (auth.uid() in (user_id, friend_id));

create policy "friendships_self_delete" on public.friendships
  for delete using (auth.uid() in (user_id, friend_id));

-- 양방향 친구 조회 편의 뷰
create or replace view public.friends_view as
  select user_id, friend_id, accepted_at from public.friendships where status = 'accepted'
  union all
  select friend_id as user_id, user_id as friend_id, accepted_at
    from public.friendships where status = 'accepted';

-- 친구 초대 (소셜 공유 링크 방식)
create table if not exists public.friend_invites (
  id              uuid primary key default gen_random_uuid(),
  inviter_id      uuid not null references public.profiles(id) on delete cascade,
  invite_code     text not null unique,
  channel         text check (channel in ('kakao', 'web_share', 'link')),
  message         text,
  invitee_user_id uuid references public.profiles(id),
  status          text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at      timestamptz default (now() + interval '30 days'),
  created_at      timestamptz default now(),
  accepted_at     timestamptz
);

create index if not exists friend_invites_code_idx on public.friend_invites (invite_code);
create index if not exists friend_invites_inviter_idx on public.friend_invites (inviter_id);

alter table public.friend_invites enable row level security;

create policy "friend_invites_inviter_all" on public.friend_invites
  for all using (auth.uid() = inviter_id) with check (auth.uid() = inviter_id);

-- 미인증/타인도 코드로 조회 가능해야 함 (수락 페이지)
create policy "friend_invites_code_lookup" on public.friend_invites
  for select using (status = 'pending' and expires_at > now());

-- =============================================================
-- 3. 일기 (1번 성찰 일기)
-- =============================================================
create table if not exists public.diary_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  entry_date    date not null default current_date,
  template_type text not null default 'daily'
    check (template_type in ('daily', 'gratitude', 'future_mission')),
  title         text,
  content       text,
  visibility    text not null default 'private'
    check (visibility in ('private', 'friends', 'public')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists diary_user_date_idx on public.diary_entries (user_id, entry_date desc);
create index if not exists diary_visibility_idx on public.diary_entries (visibility, created_at desc);
create index if not exists diary_content_trgm_idx on public.diary_entries using gin (content gin_trgm_ops);

alter table public.diary_entries enable row level security;

create policy "diary_owner_all" on public.diary_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "diary_public_read" on public.diary_entries
  for select using (visibility = 'public');

create policy "diary_friends_read" on public.diary_entries
  for select using (
    visibility = 'friends'
    and exists (
      select 1 from public.friends_view fv
      where fv.user_id = auth.uid() and fv.friend_id = diary_entries.user_id
    )
  );

-- 일기 멀티미디어
create table if not exists public.diary_media (
  id           uuid primary key default gen_random_uuid(),
  entry_id     uuid not null references public.diary_entries(id) on delete cascade,
  storage_path text not null,
  media_type   text not null check (media_type in ('image', 'video', 'audio')),
  sort_order   int default 0,
  created_at   timestamptz default now()
);

create index if not exists diary_media_entry_idx on public.diary_media (entry_id, sort_order);

alter table public.diary_media enable row level security;

create policy "diary_media_via_entry" on public.diary_media
  for all using (
    exists (select 1 from public.diary_entries de where de.id = diary_media.entry_id and de.user_id = auth.uid())
  );

-- 일기-태그 매핑
create table if not exists public.diary_entry_tags (
  entry_id uuid not null references public.diary_entries(id) on delete cascade,
  tag_id   uuid not null references public.tags(id) on delete cascade,
  primary key (entry_id, tag_id)
);

create index if not exists diary_entry_tags_tag_idx on public.diary_entry_tags (tag_id);

alter table public.diary_entry_tags enable row level security;

create policy "diary_entry_tags_via_entry" on public.diary_entry_tags
  for all using (
    exists (select 1 from public.diary_entries de where de.id = diary_entry_tags.entry_id and de.user_id = auth.uid())
  );

-- =============================================================
-- 4. 장기 삶 계획 (2번)
-- =============================================================
create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  area           text not null
    check (area in ('finance', 'health', 'family', 'growth')),
  title          text not null,
  description    text,
  period_months  int not null check (period_months in (3, 6, 12, 60)),
  start_date     date not null default current_date,
  due_date       date,
  priority       int default 3 check (priority between 1 and 5),
  status         text not null default 'active'
    check (status in ('active', 'completed', 'paused', 'archived')),
  progress_pct   int default 0 check (progress_pct between 0 and 100),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  completed_at   timestamptz
);

create index if not exists goals_user_status_idx on public.goals (user_id, status, priority);
create index if not exists goals_user_area_idx on public.goals (user_id, area);

alter table public.goals enable row level security;

create policy "goals_owner_all" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 세부 실행 계획 (2.2)
create table if not exists public.goal_plans (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid not null references public.goals(id) on delete cascade,
  title       text not null,
  plan_type   text default 'custom'
    check (plan_type in ('weekly_checklist', 'monthly_review', 'milestone', 'custom')),
  due_date    date,
  status      text default 'todo' check (status in ('todo', 'doing', 'done')),
  sort_order  int default 0,
  created_at  timestamptz default now()
);

create index if not exists goal_plans_goal_idx on public.goal_plans (goal_id, sort_order);

alter table public.goal_plans enable row level security;

create policy "goal_plans_via_goal" on public.goal_plans
  for all using (
    exists (select 1 from public.goals g where g.id = goal_plans.goal_id and g.user_id = auth.uid())
  );

-- 진척도 로그 (대시보드용)
create table if not exists public.goal_progress_logs (
  id           uuid primary key default gen_random_uuid(),
  goal_id      uuid not null references public.goals(id) on delete cascade,
  plan_id      uuid references public.goal_plans(id) on delete set null,
  note         text,
  progress_pct int check (progress_pct between 0 and 100),
  logged_at    timestamptz default now()
);

create index if not exists goal_progress_goal_idx on public.goal_progress_logs (goal_id, logged_at desc);

alter table public.goal_progress_logs enable row level security;

create policy "goal_progress_via_goal" on public.goal_progress_logs
  for all using (
    exists (select 1 from public.goals g where g.id = goal_progress_logs.goal_id and g.user_id = auth.uid())
  );

-- 일기 ↔ 목표 연결 (2.1 요구: 관련된 일기를 링크)
create table if not exists public.diary_goal_links (
  diary_id   uuid not null references public.diary_entries(id) on delete cascade,
  goal_id    uuid not null references public.goals(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (diary_id, goal_id)
);

create index if not exists diary_goal_links_goal_idx on public.diary_goal_links (goal_id);

alter table public.diary_goal_links enable row level security;

create policy "diary_goal_links_via_owner" on public.diary_goal_links
  for all using (
    exists (select 1 from public.diary_entries de where de.id = diary_goal_links.diary_id and de.user_id = auth.uid())
    and exists (select 1 from public.goals g where g.id = diary_goal_links.goal_id and g.user_id = auth.uid())
  );

-- =============================================================
-- 5. 콘텐츠 허브 (3번 숲 탭)
-- =============================================================
create table if not exists public.contents (
  id                     uuid primary key default gen_random_uuid(),
  category               text not null
    check (category in ('finance', 'health', 'family', 'death_prep', 'memorial', 'reflection')),
  title                  text not null,
  body                   text,
  content_type           text not null default 'text'
    check (content_type in ('text', 'video', 'audio')),
  media_url              text,
  source_url             text,
  author_type            text not null default 'user'
    check (author_type in ('official', 'user')),
  creator_id             uuid references public.profiles(id) on delete set null,
  promoted_from_post_id  uuid,
  promoted_at            timestamptz,
  promoted_by            uuid references public.profiles(id),
  benefit_status         text default 'none'
    check (benefit_status in ('none', 'pending', 'granted')),
  related_question_id    bigint,
  memorial_meta          jsonb,
  is_published           boolean default true,
  view_count             int default 0,
  like_count             int default 0,
  bookmark_count         int default 0,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

create index if not exists contents_category_idx on public.contents (category, is_published, created_at desc);
create index if not exists contents_creator_idx on public.contents (creator_id);
create index if not exists contents_promoted_idx on public.contents (author_type, promoted_at desc);

alter table public.contents enable row level security;

create policy "contents_public_read" on public.contents
  for select using (is_published = true);

create policy "contents_creator_write" on public.contents
  for insert with check (auth.uid() = creator_id);

create policy "contents_creator_update" on public.contents
  for update using (auth.uid() = creator_id);

create policy "contents_creator_delete" on public.contents
  for delete using (auth.uid() = creator_id);

-- 콘텐츠 미디어
create table if not exists public.content_media (
  id           uuid primary key default gen_random_uuid(),
  content_id   uuid not null references public.contents(id) on delete cascade,
  storage_path text not null,
  media_type   text not null check (media_type in ('image', 'video', 'audio')),
  sort_order   int default 0
);

create index if not exists content_media_content_idx on public.content_media (content_id, sort_order);

alter table public.content_media enable row level security;

create policy "content_media_public_read" on public.content_media for select using (true);

create policy "content_media_creator_write" on public.content_media
  for all using (
    exists (select 1 from public.contents c where c.id = content_media.content_id and c.creator_id = auth.uid())
  );

-- 콘텐츠 북마크 (3.2)
create table if not exists public.content_bookmarks (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  folder     text,
  created_at timestamptz default now(),
  primary key (user_id, content_id)
);

create index if not exists content_bookmarks_user_idx on public.content_bookmarks (user_id, created_at desc);

alter table public.content_bookmarks enable row level security;

create policy "content_bookmarks_owner_all" on public.content_bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- 6. 커뮤니티 (4번)
-- =============================================================
create table if not exists public.boards (
  id          serial primary key,
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

alter table public.boards enable row level security;
create policy "boards_public_read" on public.boards for select using (is_active = true);

-- 시드 게시판
insert into public.boards (slug, name, description, sort_order) values
  ('parent-care',  '부모 케어링',     '부모님 케어링의 경험과 노하우를 나눠요',    10),
  ('retirement',   '노후 준비',     '재정·건강·관계, 노년기 준비 이야기',     20),
  ('end-of-life',  '삶의 마무리',   '존엄한 마지막을 함께 준비합니다',         30),
  ('reflection',   '오늘의 성찰',   '하루를 돌아보며 나누고 싶은 생각',         40),
  ('memorial',     '추모',          '소중한 분을 기억하며',                    50),
  ('free',         '자유',          '주제 없이 자유롭게',                      90)
on conflict (slug) do nothing;

create table if not exists public.community_posts (
  id                uuid primary key default gen_random_uuid(),
  board_id          int not null references public.boards(id),
  content_thread_id uuid references public.contents(id) on delete set null,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  title             text not null,
  body              text,
  view_count        int default 0,
  comment_count     int default 0,
  reaction_count    int default 0,
  is_deleted        boolean default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists posts_board_idx on public.community_posts (board_id, created_at desc) where is_deleted = false;
create index if not exists posts_user_idx on public.community_posts (user_id);
create index if not exists posts_content_thread_idx on public.community_posts (content_thread_id) where content_thread_id is not null;

alter table public.community_posts enable row level security;

create policy "posts_public_read" on public.community_posts
  for select using (is_deleted = false);

create policy "posts_owner_write" on public.community_posts
  for insert with check (auth.uid() = user_id);

create policy "posts_owner_update" on public.community_posts
  for update using (auth.uid() = user_id);

create policy "posts_owner_delete" on public.community_posts
  for delete using (auth.uid() = user_id);

-- 게시글 미디어
create table if not exists public.post_media (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.community_posts(id) on delete cascade,
  storage_path text not null,
  media_type   text not null check (media_type in ('image', 'video')),
  sort_order   int default 0
);

create index if not exists post_media_post_idx on public.post_media (post_id, sort_order);

alter table public.post_media enable row level security;

create policy "post_media_public_read" on public.post_media for select using (true);

create policy "post_media_owner_write" on public.post_media
  for all using (
    exists (select 1 from public.community_posts p where p.id = post_media.post_id and p.user_id = auth.uid())
  );

-- 게시글-태그 매핑
create table if not exists public.post_tags (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  tag_id  uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

alter table public.post_tags enable row level security;

create policy "post_tags_via_owner" on public.post_tags
  for all using (
    exists (select 1 from public.community_posts p where p.id = post_tags.post_id and p.user_id = auth.uid())
  );

create policy "post_tags_public_read" on public.post_tags for select using (true);

-- 댓글 (4.2)
create table if not exists public.comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references public.community_posts(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  body              text not null,
  is_deleted        boolean default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);
create index if not exists comments_user_idx on public.comments (user_id);

alter table public.comments enable row level security;

create policy "comments_public_read" on public.comments for select using (is_deleted = false);
create policy "comments_owner_write" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_owner_update" on public.comments for update using (auth.uid() = user_id);
create policy "comments_owner_delete" on public.comments for delete using (auth.uid() = user_id);

-- 반응 (좋아요/공감) — 게시글·댓글·콘텐츠 공용 (4.3)
create table if not exists public.reactions (
  id            uuid primary key default gen_random_uuid(),
  target_type   text not null check (target_type in ('post', 'comment', 'content', 'diary')),
  target_id     uuid not null,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null default 'like' check (reaction_type in ('like', 'empathy', 'support', 'flower')),
  created_at    timestamptz default now(),
  unique (target_type, target_id, user_id, reaction_type)
);

create index if not exists reactions_target_idx on public.reactions (target_type, target_id);
create index if not exists reactions_user_idx on public.reactions (user_id);

alter table public.reactions enable row level security;

create policy "reactions_public_read" on public.reactions for select using (true);
create policy "reactions_owner_write" on public.reactions for insert with check (auth.uid() = user_id);
create policy "reactions_owner_delete" on public.reactions for delete using (auth.uid() = user_id);

-- 신고 (4.4)
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment', 'content', 'profile')),
  target_id   uuid not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason      text not null,
  detail      text,
  status      text not null default 'pending'
    check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  handled_by  uuid references public.profiles(id),
  handled_at  timestamptz,
  created_at  timestamptz default now()
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

create policy "reports_reporter_insert" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "reports_reporter_read" on public.reports
  for select using (auth.uid() = reporter_id);

-- =============================================================
-- 7. 케어링 강화 (7번)
-- =============================================================
-- 응급 연락처 (7.5)
create table if not exists public.care_emergency_contacts (
  id         uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.care_subjects(id) on delete cascade,
  name       text not null,
  phone      text not null,
  relation   text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists care_emergency_subject_idx on public.care_emergency_contacts (subject_id, sort_order);

alter table public.care_emergency_contacts enable row level security;

create policy "care_emergency_via_member" on public.care_emergency_contacts
  for all using (
    exists (
      select 1 from public.care_members cm
      where cm.subject_id = care_emergency_contacts.subject_id
        and cm.user_id = auth.uid()
    )
  );

-- 케어링 대시보드 집계 뷰 (7.4)
create or replace view public.care_dashboard_view as
  select
    cl.subject_id,
    date_trunc('week', cl.created_at)::date as week_start,
    count(*) as log_count,
    count(distinct date_trunc('day', cl.created_at)) as days_logged,
    mode() within group (order by cl.mood) as dominant_mood
  from public.care_logs cl
  group by cl.subject_id, date_trunc('week', cl.created_at);

-- =============================================================
-- 8. 푸시 구독 (PWA Web Push)
-- =============================================================
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null,
  p256dh_key text not null,
  auth_key   text not null,
  user_agent text,
  created_at timestamptz default now(),
  last_used  timestamptz default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subs_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subs_owner_all" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- 9. 트리거: updated_at 자동 갱신
-- =============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'diary_entries', 'goals', 'contents', 'community_posts', 'comments'
  ]) loop
    execute format('drop trigger if exists trg_%I_updated on public.%I', t, t);
    execute format('create trigger trg_%I_updated before update on public.%I
                    for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- =============================================================
-- 10. 카운터 RPC (race condition 안전)
-- =============================================================
create or replace function public.increment_post_comment_count(p_post_id uuid)
returns void language sql security definer as $$
  update public.community_posts
  set comment_count = coalesce(comment_count, 0) + 1
  where id = p_post_id;
$$;

create or replace function public.decrement_post_comment_count(p_post_id uuid)
returns void language sql security definer as $$
  update public.community_posts
  set comment_count = greatest(coalesce(comment_count, 0) - 1, 0)
  where id = p_post_id;
$$;

-- =============================================================
-- user_songs — 사용자가 본인 라이프에 묶어두는 곡들
-- MVP: kind='final' (내 마지막에 흐를 한 곡). 1인 1곡(kind 기준 unique).
-- 미래: kind='memory', 'wedding' 등으로 확장 가능.
-- =============================================================

create table if not exists public.user_songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'final',
  spotify_track_id text not null,
  name text not null,
  artists text not null default '',
  image_url text default '',
  external_url text default '',
  preview_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind)
);

alter table public.user_songs enable row level security;

-- 본인 곡만 조회/수정/삭제
drop policy if exists "own songs select" on public.user_songs;
create policy "own songs select" on public.user_songs
  for select using (auth.uid() = user_id);

drop policy if exists "own songs insert" on public.user_songs;
create policy "own songs insert" on public.user_songs
  for insert with check (auth.uid() = user_id);

drop policy if exists "own songs update" on public.user_songs;
create policy "own songs update" on public.user_songs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own songs delete" on public.user_songs;
create policy "own songs delete" on public.user_songs
  for delete using (auth.uid() = user_id);

create index if not exists user_songs_user_idx on public.user_songs (user_id, kind);

-- 묻다 — 유언장 수정 기록 (판 스냅샷)
-- 초안을 만들거나 수정할 때마다 한 판씩 저장해, 사용자가 최종본이
-- 언제 것인지와 지난 내용을 언제든 확인할 수 있게 한다.

create table if not exists public.mutda_will_revisions (
  id uuid primary key default gen_random_uuid(),
  will_id uuid not null references public.mutda_wills(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version int not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.mutda_will_revisions enable row level security;

drop policy if exists mutda_will_revisions_owner_read on public.mutda_will_revisions;
create policy mutda_will_revisions_owner_read on public.mutda_will_revisions
  for select using (auth.uid() = user_id);

drop policy if exists mutda_will_revisions_owner_insert on public.mutda_will_revisions;
create policy mutda_will_revisions_owner_insert on public.mutda_will_revisions
  for insert with check (auth.uid() = user_id);

create index if not exists mutda_will_revisions_will_idx
  on public.mutda_will_revisions(will_id, version desc);

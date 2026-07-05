-- ============================================================
-- 묻다 v2 — 안부확인 알림을 이메일에서 앱푸시로 전환
-- 보호 연락처: 전화번호 + 지정순위. 보호자는 초대 링크로 묻다에 연결되어
-- 웹푸시 + 인앱 알림을 받는다.
-- VAPID 키쌍은 Vault(mutda_vapid_public / mutda_vapid_private)에 저장 —
-- 코드·저장소에 개인키를 남기지 않는다.
-- ============================================================

-- 1) 보호 연락처: 보호자 계정 연결용 컬럼
alter table public.mutda_guardians
  add column if not exists guardian_user_id uuid references auth.users(id) on delete set null,
  add column if not exists invite_code text unique default encode(extensions.gen_random_bytes(9), 'hex'),
  add column if not exists linked_at timestamptz;

-- 기존 행에도 초대 코드 채우기
update public.mutda_guardians
   set invite_code = encode(extensions.gen_random_bytes(9), 'hex')
 where invite_code is null;

-- 2) 묻다 푸시 구독 (잇다 push_subscriptions와 분리)
create table if not exists public.mutda_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh_key text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.mutda_push_subscriptions enable row level security;

drop policy if exists mutda_push_subs_owner on public.mutda_push_subscriptions;
create policy mutda_push_subs_owner on public.mutda_push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) 인앱 알림 (푸시를 놓쳐도 앱을 열면 보이도록)
create table if not exists public.mutda_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade, -- 수신자
  kind text not null default 'general',
  title text not null,
  body text,
  url text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.mutda_notifications enable row level security;

drop policy if exists mutda_notifications_owner_read on public.mutda_notifications;
create policy mutda_notifications_owner_read on public.mutda_notifications
  for select using (auth.uid() = user_id);

drop policy if exists mutda_notifications_owner_update on public.mutda_notifications;
create policy mutda_notifications_owner_update on public.mutda_notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists mutda_notifications_user_idx
  on public.mutda_notifications(user_id, read, created_at desc);

-- 4) 보호자 초대 미리보기 — 코드만으로 "누가 나를 보호자로 지정했나" 확인
--    (로그인 전에도 초대 화면을 보여주기 위해 anon 허용, 이름만 노출)
create or replace function public.mutda_guardian_preview(p_code text)
returns table (user_name text, guardian_name text, already_linked boolean)
language sql security definer set search_path = public as $$
  select coalesce(p.name, '묻다 사용자') as user_name,
         g.name as guardian_name,
         (g.guardian_user_id is not null) as already_linked
    from public.mutda_guardians g
    left join public.mutda_profiles p on p.user_id = g.user_id
   where g.invite_code = p_code;
$$;

grant execute on function public.mutda_guardian_preview(text) to anon, authenticated;

-- 5) 보호자 연결 — 로그인한 사용자가 초대 코드를 수락
create or replace function public.mutda_link_guardian(p_code text)
returns table (user_name text, guardian_name text)
language plpgsql security definer set search_path = public as $$
declare
  g record;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  select * into g from public.mutda_guardians where invite_code = p_code;
  if g is null then
    raise exception '유효하지 않은 초대예요';
  end if;
  if g.user_id = auth.uid() then
    raise exception '자기 자신을 보호자로 연결할 수 없어요';
  end if;
  if g.guardian_user_id is not null and g.guardian_user_id <> auth.uid() then
    raise exception '이미 다른 계정과 연결된 초대예요';
  end if;

  update public.mutda_guardians
     set guardian_user_id = auth.uid(), linked_at = now()
   where id = g.id;

  return query
    select coalesce(p.name, '묻다 사용자'), g.name
      from public.mutda_profiles p where p.user_id = g.user_id;
end;
$$;

grant execute on function public.mutda_link_guardian(text) to authenticated;

-- 6) Edge Function용 VAPID 조회 — service_role 전용
create or replace function public.mutda_get_vapid()
returns table (public_key text, private_key text)
language sql security definer set search_path = public as $$
  select
    (select decrypted_secret from vault.decrypted_secrets where name = 'mutda_vapid_public'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'mutda_vapid_private');
$$;

revoke execute on function public.mutda_get_vapid() from public, anon, authenticated;
grant execute on function public.mutda_get_vapid() to service_role;

-- 7) 클라이언트 구독용 공개키 조회 (공개키는 노출돼도 안전)
create or replace function public.mutda_get_vapid_public()
returns text
language sql security definer set search_path = public as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'mutda_vapid_public';
$$;

grant execute on function public.mutda_get_vapid_public() to anon, authenticated;

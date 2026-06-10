-- 케어링 업데이트 알림 (인앱 알림함)
-- 목적: 같은 케어링 대상자(care_subjects)에 연결된 멤버 전원에게,
--       새 케어 기록(care_logs)이 올라오면 인앱 알림을 남긴다. 작성자 본인은 제외.
-- 범위(중요): 이 마이그레이션은 '인앱 알림함'만 만든다(무료, 의존성 0).
--   Web Push 발송은 별도의 push-notify Edge Function + Database Webhook이 담당한다.
--   카카오 알림톡(건당 과금)은 1차 범위 밖 — 옵트인 의사만 profiles.notification_pref에 저장.
-- 적용: apply_migration 으로 원격 반영 필요(창업자 승인 후).

-- =============================================================
-- 1. notifications 테이블 (수신자별 1행)
-- =============================================================
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade, -- 받는 사람
  type         text not null,            -- 'care_log' | 'care_sos' | (확장 여지)
  subject_id   uuid,                     -- 관련 케어링 대상자 (있으면)
  source_table text,                     -- 출처 테이블 ('care_logs' 등)
  source_id    uuid,                     -- 출처 레코드 id
  actor_id     uuid,                     -- 알림을 유발한 사람(작성자)
  title        text not null,
  body         text,
  url          text,                     -- 클릭 시 이동할 경로
  read_at      timestamptz,              -- 읽음 시각(NULL=안 읽음)
  created_at   timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at, created_at desc);

alter table public.notifications enable row level security;

-- 받는 사람 본인만 조회/읽음처리/삭제 가능.
-- INSERT 정책은 의도적으로 없음 → 트리거(SECURITY DEFINER)만 행을 만든다.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete to authenticated using (auth.uid() = user_id);

-- =============================================================
-- 2. 케어 기록 → 멤버 알림 트리거
--    수신 대상 = (대상자 owner) ∪ (care_members) − 작성자(author_id)
-- =============================================================
create or replace function public.notify_care_members_on_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subject_name text;
  v_owner        uuid;
  v_is_sos       boolean;
  v_title        text;
  v_preview      text;
begin
  select name, user_id into v_subject_name, v_owner
  from public.care_subjects where id = NEW.subject_id;

  v_is_sos := coalesce(NEW.mood, '') = 'urgent'
              or coalesce(NEW.daily_status, '') like '[SOS]%';

  v_preview := left(
    coalesce(nullif(trim(NEW.daily_status), ''),
             nullif(trim(NEW.free_memo), ''),
             '새 케어 기록이 올라왔어요'), 100);

  insert into public.notifications
    (user_id, type, subject_id, source_table, source_id, actor_id, title, body, url)
  select
    aud.uid,
    case when v_is_sos then 'care_sos' else 'care_log' end,
    NEW.subject_id,
    'care_logs',
    NEW.id,
    NEW.author_id,
    case when v_is_sos
         then '🚨 ' || coalesce(v_subject_name, '케어링') || ' 응급 상황'
         else coalesce(v_subject_name, '케어링') || ' 새 기록' end,
    v_preview,
    './care-dashboard.html?subject=' || NEW.subject_id
  from (
    select v_owner as uid
    union
    select cm.user_id from public.care_members cm where cm.subject_id = NEW.subject_id
  ) aud
  where aud.uid is not null
    and aud.uid <> NEW.author_id;

  return NEW;
end;
$$;

drop trigger if exists trg_notify_care_members_on_log on public.care_logs;
create trigger trg_notify_care_members_on_log
  after insert on public.care_logs
  for each row execute function public.notify_care_members_on_log();

-- =============================================================
-- 3. 실시간 구독용 publication 등록 (이미 있으면 무시)
-- =============================================================
do $$
begin
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
           when others then null;
  end;
end $$;

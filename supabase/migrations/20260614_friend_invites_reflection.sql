-- =============================================================
-- 답변→공유→초대 유입 루프 — friend_invites 보강
-- 단일 원천: docs/strategy/answer-invite-loop-2026-06-14.md (C3 기존 friend_invites 활용)
-- 본 마이그레이션은 idempotent (재실행 안전)
-- =============================================================
--
-- 변경:
-- 1) friend_invites.channel CHECK 제약에 'reflection_invite' 값 허용 추가
-- 2) friend_invites에 metadata jsonb 컬럼 추가 (질문 id, 익명 토글 등)
-- 3) (선택) mark_reflection_invite_consumed RPC — 초대받은 친구가 가입 후 마킹
-- =============================================================

-- 1) channel CHECK 제약 보강 (kakao, web_share, link, reflection_invite)
do $$
declare
  v_constraint_name text;
begin
  select conname into v_constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  where t.relname = 'friend_invites'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) like '%channel%';

  if v_constraint_name is not null then
    execute format('alter table public.friend_invites drop constraint %I', v_constraint_name);
  end if;

  alter table public.friend_invites
    add constraint friend_invites_channel_check
    check (channel in ('kakao', 'web_share', 'link', 'reflection_invite'));
end$$;

-- 2) metadata jsonb 컬럼 추가
alter table public.friend_invites
  add column if not exists metadata jsonb default '{}'::jsonb;

create index if not exists friend_invites_metadata_kind_idx
  on public.friend_invites ((metadata->>'kind'))
  where metadata is not null;

-- 3) 초대받은 친구가 가입 후 마킹할 수 있는 RPC (security definer)
--    RLS상 inviter_id만 update 가능 → invitee가 직접 update 불가 → 별도 RPC 필요
--    accept_friend_invite와 다른 흐름: friendships 생성 X (답변→공유는 친구 관계 X, 그저 질문에 답한 사람)
create or replace function public.mark_reflection_invite_consumed(p_invite_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;

  select * into v_invite
  from public.friend_invites
  where id = p_invite_id
    and channel = 'reflection_invite'
    and status = 'pending'
    and expires_at > now()
  limit 1;

  if v_invite is null then
    return jsonb_build_object('success', false, 'reason', 'not_found_or_expired');
  end if;

  if v_invite.inviter_id = v_uid then
    return jsonb_build_object('success', false, 'reason', 'self_invite');
  end if;

  update public.friend_invites
  set status = 'accepted',
      invitee_user_id = v_uid,
      accepted_at = now()
  where id = p_invite_id;

  return jsonb_build_object(
    'success', true,
    'invite_id', p_invite_id
  );
end;
$$;

revoke all on function public.mark_reflection_invite_consumed(uuid) from public;
grant execute on function public.mark_reflection_invite_consumed(uuid) to authenticated;

-- =============================================================
-- 친구 초대 수락 RPC (RLS 우회, security definer)
-- =============================================================
-- 문제: friendships RLS 정책이 auth.uid() = user_id 만 허용해서
-- 초대받은 invitee가 inviter 행을 만들 수 없음 → row-level security 위반
-- 해결: SECURITY DEFINER RPC로 양방향 행을 한 번에 안전하게 생성
--
-- 실행: Supabase SQL Editor에 붙여넣고 Run
-- =============================================================

create or replace function public.accept_friend_invite(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_uid uuid := auth.uid();
  v_inviter_name text;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다';
  end if;

  -- 초대 조회 + 유효성 검증
  select * into v_invite
  from public.friend_invites
  where invite_code = upper(p_code)
    and status = 'pending'
    and expires_at > now()
  limit 1;

  if v_invite is null then
    raise exception '유효하지 않거나 만료된 초대입니다';
  end if;

  if v_invite.inviter_id = v_uid then
    raise exception '본인에게 초대할 수 없어요';
  end if;

  -- 양방향 친구 관계 생성 (이미 있으면 accepted로 갱신)
  insert into public.friendships (user_id, friend_id, status, initiated_by, accepted_at)
    values (v_invite.inviter_id, v_uid, 'accepted', v_invite.inviter_id, now())
  on conflict (user_id, friend_id) do update
    set status = 'accepted',
        accepted_at = now();

  insert into public.friendships (user_id, friend_id, status, initiated_by, accepted_at)
    values (v_uid, v_invite.inviter_id, 'accepted', v_invite.inviter_id, now())
  on conflict (user_id, friend_id) do update
    set status = 'accepted',
        accepted_at = now();

  -- 초대 상태 갱신
  update public.friend_invites
  set status = 'accepted',
      invitee_user_id = v_uid,
      accepted_at = now()
  where id = v_invite.id;

  -- 초대자 이름 조회 (응답용)
  select name into v_inviter_name from public.profiles where id = v_invite.inviter_id;

  return jsonb_build_object(
    'success', true,
    'inviter_id', v_invite.inviter_id,
    'inviter_name', coalesce(v_inviter_name, '잇다 사용자')
  );
end;
$$;

-- 인증된 사용자만 실행 가능
revoke all on function public.accept_friend_invite(text) from public;
grant execute on function public.accept_friend_invite(text) to authenticated;

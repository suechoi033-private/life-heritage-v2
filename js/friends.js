// 친구 시스템 헬퍼 — 초대 코드 발급/수락, 친구 목록 조회

import { supabase } from '../auth.js';

const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(length = 8) {
  let code = '';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) code += INVITE_CODE_CHARS[arr[i] % INVITE_CODE_CHARS.length];
  return code;
}

// 초대 코드 발급
export async function createFriendInvite({ message = '', channel = 'link' } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');

  let code, attempt = 0;
  while (attempt < 5) {
    code = generateInviteCode();
    const { error } = await supabase.from('friend_invites').insert({
      inviter_id: user.id,
      invite_code: code,
      channel,
      message,
    });
    if (!error) break;
    if (error.code !== '23505') throw error;
    attempt++;
  }

  const url = `${location.origin}${location.pathname.replace(/[^/]+$/, '')}invite.html?code=${code}`;
  return { code, url };
}

// 카카오톡 공유 (Kakao SDK 로드되어 있어야 함)
export async function shareViaKakao({ url, inviterName }) {
  if (!window.Kakao || !window.Kakao.isInitialized()) {
    throw new Error('Kakao SDK 미초기화');
  }
  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: '잇다에 초대합니다',
      description: `${inviterName || ''}님이 잇다 친구로 초대했어요.\n삶을 성찰하고 함께 기록하는 곳, 잇다에서 만나요.`,
      imageUrl: `${location.origin}${location.pathname.replace(/[^/]+$/, '')}icons/icon-512.png`,
      link: { mobileWebUrl: url, webUrl: url },
    },
    buttons: [
      { title: '초대 수락하기', link: { mobileWebUrl: url, webUrl: url } },
    ],
  });
}

// 일반 공유 (Web Share API)
export async function shareViaWebShare({ url, text }) {
  if (!navigator.share) {
    await navigator.clipboard.writeText(url);
    return { fallback: 'clipboard' };
  }
  await navigator.share({
    title: '잇다 친구 초대',
    text: text || '잇다에서 함께 기록해요',
    url,
  });
  return { fallback: null };
}

// 초대 코드로 조회
export async function fetchInviteByCode(code) {
  const { data, error } = await supabase
    .from('friend_invites')
    .select('id, inviter_id, invite_code, status, expires_at, message')
    .eq('invite_code', code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (data.status !== 'pending' || new Date(data.expires_at) <= new Date()) return null;

  // 초대자 프로필 조회
  const { data: inviter } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .eq('id', data.inviter_id)
    .maybeSingle();

  return { ...data, inviter };
}

// 초대 수락 — RLS 우회를 위해 security definer RPC 호출
export async function acceptFriendInvite(code) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');

  const { data, error } = await supabase.rpc('accept_friend_invite', { p_code: code.toUpperCase() });
  if (error) {
    // 한국어 메시지로 변환
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('유효하지') || msg.includes('만료'))  throw new Error('유효하지 않거나 만료된 초대입니다');
    if (msg.includes('본인'))                               throw new Error('본인에게 초대할 수 없어요');
    if (msg.includes('로그인'))                             throw new Error('로그인이 필요합니다');
    throw error;
  }
  return {
    inviter: { id: data?.inviter_id, name: data?.inviter_name },
  };
}

// 친구 목록
export async function listFriends() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friendships')
    .select('friend_id, status, accepted_at')
    .eq('user_id', user.id)
    .eq('status', 'accepted')
    .order('accepted_at', { ascending: false });
  if (error) throw error;

  if (!data?.length) return [];
  const ids = data.map((r) => r.friend_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', ids);

  return profiles || [];
}

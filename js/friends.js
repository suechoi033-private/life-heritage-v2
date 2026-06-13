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
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
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
export async function shareViaKakao({ url, inviterName, message }) {
  if (!window.Kakao || !window.Kakao.isInitialized()) {
    throw new Error('Kakao SDK 미초기화');
  }
  const name = (inviterName || '').trim();
  // 보내는 사람을 주어로 세운 사람 대 사람 메시지 (앱 홍보문 아님).
  // 가운뎃점으로 이름 뒤 조사(이/가) 문제를 피한다.
  const title = name ? `${name} · 함께 기록을 봐요` : '잇다에서 함께 기록을 봐요';
  // 개인 메시지를 쓰면 그게 본문을 대체(가장 따뜻하고 구체적).
  const description = (message && message.trim())
    ? message.trim()
    : '그동안 남긴 기록을 같은 곳에서 함께 볼 수 있어요. 링크를 열어보세요.';
  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title,
      description,
      imageUrl: `${location.origin}${location.pathname.replace(/[^/]+$/, '')}icons/icon-512.png`,
      link: { mobileWebUrl: url, webUrl: url },
    },
    buttons: [
      { title: '열어보기', link: { mobileWebUrl: url, webUrl: url } },
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

// 가족 초대 미리보기 (비로그인 가능) — preview_friend_invite RPC.
// "보기 먼저"(P6): 가입 전에 보낸 사람 이름 + 한마디를 보여준다.
// ※ RPC는 창업자 승인 후 적용. 미적용 시 호출이 실패하면 호출측에서 일반 화면으로 폴백한다.
export async function previewFriendInvite(code) {
  const { data, error } = await supabase.rpc('preview_friend_invite', { p_code: code.toUpperCase() });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row || null; // { inviter_name, message }
}

// 초대 수락 — RLS 우회를 위해 security definer RPC 호출
export async function acceptFriendInvite(code) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
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

// 내가 보낸 대기중(pending) 초대 — 발급 후 데드엔드 방지용 상태 표시
// (발급자 본인 조회라 inviter RLS로 프런트 단독 가능, DB 변경 없음)
export async function listMyPendingInvites() {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return [];
  const { data, error } = await supabase
    .from('friend_invites')
    .select('invite_code, status, created_at, expires_at')
    .eq('inviter_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  // 만료된 건 제외
  return (data || []).filter((r) => new Date(r.expires_at) > new Date());
}

// 친구 목록
export async function listFriends() {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
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

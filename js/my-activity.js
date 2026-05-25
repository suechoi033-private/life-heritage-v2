// 마이페이지 활동 통합 조회 (6.2 활동 내역 통합 조회 기능)
import { supabase } from '../auth.js';

// 통계 카운트 한 번에
export async function getMyCounts() {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return null;

  const [diary, answers, posts, comments, reactions, friends, goalsActive, contents] = await Promise.all([
    supabase.from('diary_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('daily_answers').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_deleted', false),
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_deleted', false),
    supabase.from('reactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'accepted'),
    supabase.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
    supabase.from('contents').select('id', { count: 'exact', head: true }).eq('creator_id', user.id).eq('is_published', true),
  ]);

  // 가족/친구 분리 카운트 — de-dupe(가족 우선) 반영
  let familyCount = 0;
  let friendsDeduped = friends?.count ?? 0;
  try {
    const [family, friendList] = await Promise.all([listMyFamily(), listMyFriends()]);
    familyCount = family.length;
    friendsDeduped = friendList.length;
  } catch (_) { /* 조회 실패 시 raw friendships count 폴백 */ }

  return {
    diary:    diary?.count    ?? 0,
    answers:  answers?.count  ?? 0,
    posts:    posts?.count    ?? 0,
    comments: comments?.count ?? 0,
    reactions:reactions?.count?? 0,
    family:   familyCount,
    friends:  friendsDeduped,
    goalsActive: goalsActive?.count ?? 0,
    contents: contents?.count ?? 0,
  };
}

// 내 일기 목록
export async function listMyDiary({ limit = 20, offset = 0 } = {}) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return [];
  const { data, error } = await supabase
    .from('diary_entries')
    .select('id, entry_date, template_type, title, content, visibility, created_at')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
}

// 내 게시글
export async function listMyPosts({ limit = 20, offset = 0 } = {}) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return [];
  const { data, error } = await supabase
    .from('community_posts')
    .select('id, title, body, created_at, comment_count, reaction_count, boards(name)')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
}

// 내 콘텐츠
export async function listMyContents({ limit = 20, offset = 0 } = {}) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return [];
  const { data, error } = await supabase
    .from('contents')
    .select('id, title, category, author_type, view_count, like_count, created_at')
    .eq('creator_id', user.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
}

// 내 댓글
export async function listMyComments({ limit = 20, offset = 0 } = {}) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return [];
  const { data, error } = await supabase
    .from('comments')
    .select('id, body, created_at, post_id, community_posts(title)')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
}

// 내가 좋아요한 것
export async function listMyReactions({ limit = 20, offset = 0 } = {}) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return [];
  const { data, error } = await supabase
    .from('reactions')
    .select('id, target_type, target_id, reaction_type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
}

// 내가 소유/참여한 케어링 그룹의 subject_id 목록
// (care.js listMyCareSubjects 와 동일한 owner + member 경로)
async function getMyCareSubjectIds(userId) {
  const [{ data: owned }, { data: memberOf }] = await Promise.all([
    supabase.from('care_subjects').select('id').eq('user_id', userId),
    supabase.from('care_members').select('subject_id').eq('user_id', userId),
  ]);
  const ids = new Set();
  (owned || []).forEach((s) => s.id && ids.add(s.id));
  (memberOf || []).forEach((m) => m.subject_id && ids.add(m.subject_id));
  return Array.from(ids);
}

// 가족 목록 — 내가 함께 돌보는 케어링 그룹의 동료(care_members)
// 본인 제외, user_id 기준 de-dupe. 본인이 owner인 그룹의 다른 보호자도 포함.
// 반환: [{ id(user_id), name, avatar_url, role }]
export async function listMyFamily() {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return [];

  const subjectIds = await getMyCareSubjectIds(user.id);
  if (!subjectIds.length) return [];

  // 그룹들의 care_members(수락 완료) + owner 프로필 조회
  const [membersRes, ownersRes] = await Promise.all([
    supabase.from('care_members')
      .select('user_id, role, accepted_at, profile:profiles!user_id(id, name, avatar_url)')
      .in('subject_id', subjectIds)
      .not('accepted_at', 'is', null),
    supabase.from('care_subjects')
      .select('user_id, profiles:user_id(id, name, avatar_url)')
      .in('id', subjectIds),
  ]);
  if (membersRes.error) throw membersRes.error;

  const map = new Map(); // user_id -> { id, name, avatar_url, role }
  // owner(주 보호자) 먼저
  (ownersRes.data || []).forEach((s) => {
    const p = s.profiles;
    if (!s.user_id || s.user_id === user.id) return;
    if (!map.has(s.user_id)) {
      map.set(s.user_id, { id: s.user_id, name: p?.name || null, avatar_url: p?.avatar_url || null, role: 'owner' });
    }
  });
  // 수락된 멤버
  (membersRes.data || []).forEach((m) => {
    if (!m.user_id || m.user_id === user.id) return;
    if (!map.has(m.user_id)) {
      const p = m.profile;
      map.set(m.user_id, { id: m.user_id, name: p?.name || null, avatar_url: p?.avatar_url || null, role: m.role || 'member' });
    }
  });
  return Array.from(map.values());
}

// 친구 목록 — friendships(accepted). 중복 정책(b): 가족인 사람은 친구 목록에서 제외.
export async function listMyFriends() {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return [];
  const { data, error } = await supabase
    .from('friendships')
    .select('friend_id, accepted_at, profiles:friend_id(id, name, avatar_url)')
    .eq('user_id', user.id)
    .eq('status', 'accepted')
    .order('accepted_at', { ascending: false });
  if (error) throw error;

  let friends = (data || []).map((r) => r.profiles).filter(Boolean);

  // (b) 가족 우선 de-dupe: 가족 목록에 있는 user는 친구에서 제외
  try {
    const family = await listMyFamily();
    if (family.length) {
      const famIds = new Set(family.map((f) => f.id));
      friends = friends.filter((f) => !famIds.has(f.id));
    }
  } catch (_) { /* 가족 조회 실패 시 친구는 그대로 노출 */ }

  return friends;
}

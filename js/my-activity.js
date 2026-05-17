// 마이페이지 활동 통합 조회 (6.2 활동 내역 통합 조회 기능)
import { supabase } from '../auth.js';

// 통계 카운트 한 번에
export async function getMyCounts() {
  const { data: { user } } = await supabase.auth.getUser();
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

  return {
    diary:    diary?.count    ?? 0,
    answers:  answers?.count  ?? 0,
    posts:    posts?.count    ?? 0,
    comments: comments?.count ?? 0,
    reactions:reactions?.count?? 0,
    friends:  friends?.count  ?? 0,
    goalsActive: goalsActive?.count ?? 0,
    contents: contents?.count ?? 0,
  };
}

// 내 일기 목록
export async function listMyDiary({ limit = 20, offset = 0 } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
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

// 친구 목록
export async function listMyFriends() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('friendships')
    .select('friend_id, accepted_at, profiles:friend_id(id, name, avatar_url)')
    .eq('user_id', user.id)
    .eq('status', 'accepted')
    .order('accepted_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => r.profiles).filter(Boolean);
}

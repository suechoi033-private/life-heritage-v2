// 콘텐츠 허브 헬퍼 (조회·작성·북마크·승급)
import { supabase } from '../auth.js';

export const CATEGORIES = {
  reflection: { label: '오늘의 성찰', icon: '🕯' },
  family:     { label: '가족 돌봄',   icon: '🏡' },
  health:     { label: '건강',         icon: '💪' },
  finance:    { label: '재정',         icon: '💰' },
  death_prep: { label: '죽음 준비',    icon: '🕊' },
  memorial:   { label: '추모',         icon: '🌿' },
};

export async function listContents({ category = null, limit = 20, offset = 0 } = {}) {
  let q = supabase.from('contents')
    .select('id, category, title, body, content_type, author_type, creator_id, view_count, like_count, bookmark_count, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (category && category !== 'all') q = q.eq('category', category);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getContent(id) {
  const { data: c, error } = await supabase.from('contents')
    .select('*, profiles:creator_id(id, name, avatar_url)')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  if (!c) return null;

  // 조회수 +1 (비차단)
  supabase.from('contents').update({ view_count: (c.view_count || 0) + 1 }).eq('id', id).then(() => {});

  const [{ data: media }, { data: thread }] = await Promise.all([
    supabase.from('content_media').select('storage_path, media_type').eq('content_id', id).order('sort_order'),
    supabase.from('community_posts')
      .select('id, title, comment_count, reaction_count, created_at, user_id, profiles:user_id(name)')
      .eq('content_thread_id', id).eq('is_deleted', false)
      .order('created_at', { ascending: false }).limit(10),
  ]);

  return {
    ...c,
    media: media || [],
    discussion_posts: thread || [],
  };
}

export async function createContent({ category, title, body, content_type = 'text', media_url = null, source_url = null }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  const { data, error } = await supabase.from('contents').insert({
    category, title, body, content_type, media_url, source_url,
    author_type: 'user',
    creator_id: user.id,
    is_published: true,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateContent(id, patch) {
  const { data, error } = await supabase.from('contents').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteContent(id) {
  const { error } = await supabase.from('contents').delete().eq('id', id);
  if (error) throw error;
}

// ===== 북마크 =====
export async function isBookmarked(contentId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('content_bookmarks')
    .select('content_id').eq('user_id', user.id).eq('content_id', contentId).maybeSingle();
  return !!data;
}

export async function toggleBookmark(contentId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  const exists = await isBookmarked(contentId);
  if (exists) {
    await supabase.from('content_bookmarks').delete().eq('user_id', user.id).eq('content_id', contentId);
    return false;
  } else {
    await supabase.from('content_bookmarks').insert({ user_id: user.id, content_id: contentId });
    return true;
  }
}

export async function listMyBookmarks() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('content_bookmarks')
    .select('content_id, created_at, contents(id, category, title, author_type, view_count, like_count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((b) => b.contents).filter(Boolean);
}

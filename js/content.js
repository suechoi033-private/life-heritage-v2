// 콘텐츠 허브 헬퍼 (조회·작성·북마크·승급)
import { supabase } from '../auth.js';

export const CATEGORIES = {
  reflection: { label: '오늘 잇고', icon: '🕯' },
  family:     { label: '가족 케어링',   icon: '🏡' },
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

export async function createContent({
  category, title, body, content_type = 'text', media_url = null, source_url = null,
  format = 'article', cover_image_url = null, excerpt = null,
  checklist = null, cta_label = null, cta_url = null,
}) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) throw new Error('로그인 필요');
  const { data, error } = await supabase.from('contents').insert({
    category, title, body, content_type, media_url, source_url,
    format, cover_image_url, excerpt, checklist, cta_label, cta_url,
    author_type: 'user',
    creator_id: user.id,
    is_published: true,
  }).select().single();
  if (error) throw error;
  return data;
}

// 홈 hero용 — 최신 발행 이야기 카드 1건
export async function getFeaturedStory() {
  const { data, error } = await supabase.from('contents')
    .select('id, category, title, excerpt, body, cover_image_url, author_type, created_at, profiles:creator_id(name)')
    .eq('is_published', true)
    .eq('format', 'story')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
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

// 홈 피드용 — 신규 콘텐츠(추모 제외) + 표지/포맷/작성자
export async function listHomeFeed(limit = 12) {
  const { data, error } = await supabase.from('contents')
    .select('id, category, title, body, excerpt, cover_image_url, format, author_type, creator_id, created_at, profiles:creator_id(name, avatar_url)')
    .eq('is_published', true)
    .neq('category', 'memorial')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// 여러 콘텐츠의 좋아요·댓글(토론) 수를 배치로 — N+1 방지
export async function getEngagementMap(ids) {
  if (!ids?.length) return {};
  const { data: { session } } = await supabase.auth.getSession();
  const me = session?.user?.id || null;
  const [likesRes, cmtRes] = await Promise.all([
    supabase.from('reactions').select('target_id, user_id')
      .eq('target_type', 'content').eq('reaction_type', 'like').in('target_id', ids),
    supabase.from('comments').select('content_id')
      .in('content_id', ids).eq('is_deleted', false),
  ]);
  const map = {};
  ids.forEach((id) => { map[id] = { likes: 0, mineLiked: false, comments: 0 }; });
  (likesRes.data || []).forEach((r) => {
    const m = map[r.target_id]; if (!m) return;
    m.likes++; if (me && r.user_id === me) m.mineLiked = true;
  });
  (cmtRes.data || []).forEach((c) => {
    const m = map[c.content_id]; if (m) m.comments++;
  });
  return map;
}

// 콘텐츠 인라인 댓글
export async function listContentComments(contentId, limit = 50) {
  const { data, error } = await supabase.from('comments')
    .select('id, body, created_at, user_id, profiles:user_id(name, avatar_url)')
    .eq('content_id', contentId).eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function addContentComment(contentId, body) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) throw new Error('로그인 필요');
  const text = (body || '').trim();
  if (!text) throw new Error('내용을 입력해주세요');
  const { data, error } = await supabase.from('comments')
    .insert({ content_id: contentId, user_id: user.id, body: text })
    .select('id, body, created_at, user_id, profiles:user_id(name, avatar_url)')
    .single();
  if (error) throw error;
  return data;
}

// ===== 북마크 =====
export async function isBookmarked(contentId) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return false;
  const { data } = await supabase.from('content_bookmarks')
    .select('content_id').eq('user_id', user.id).eq('content_id', contentId).maybeSingle();
  return !!data;
}

export async function toggleBookmark(contentId) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
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

// ===== 공감 반응 ("비슷한 시기를 지나는 중") =====
// reactions 테이블 재사용: target_type='content', reaction_type='empathy'
export async function getEmpathy(contentId) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  const { count } = await supabase.from('reactions')
    .select('id', { count: 'exact', head: true })
    .eq('target_type', 'content').eq('target_id', contentId).eq('reaction_type', 'empathy');
  let mine = false;
  if (user) {
    const { data } = await supabase.from('reactions')
      .select('id').eq('target_type', 'content').eq('target_id', contentId)
      .eq('reaction_type', 'empathy').eq('user_id', user.id).maybeSingle();
    mine = !!data;
  }
  return { count: count ?? 0, mine };
}

export async function toggleEmpathy(contentId) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) throw new Error('로그인 필요');
  const { data: existing } = await supabase.from('reactions')
    .select('id').eq('target_type', 'content').eq('target_id', contentId)
    .eq('reaction_type', 'empathy').eq('user_id', user.id).maybeSingle();
  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id);
    return false;
  }
  await supabase.from('reactions').insert({
    target_type: 'content', target_id: contentId, user_id: user.id, reaction_type: 'empathy',
  });
  return true;
}

export async function listMyBookmarks() {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return [];
  const { data, error } = await supabase.from('content_bookmarks')
    .select('content_id, created_at, contents(id, category, title, author_type, view_count, like_count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((b) => b.contents).filter(Boolean);
}

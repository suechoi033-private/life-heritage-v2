// 커뮤니티(게시판/댓글/반응/신고) 헬퍼
import { supabase } from '../auth.js';

export const REPORT_REASONS = [
  '욕설·비방',
  '광고·스팸',
  '음란·폭력',
  '개인정보 노출',
  '부정확/허위 정보',
  '기타',
];

// 게시판 목록
export async function listBoards() {
  const { data, error } = await supabase.from('boards')
    .select('id, slug, name, description, sort_order')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

// 게시글 목록
export async function listPosts({ boardId = null, limit = 20, offset = 0 } = {}) {
  let q = supabase.from('community_posts')
    .select('id, board_id, title, body, view_count, comment_count, reaction_count, created_at, user_id, profiles:user_id(name, avatar_url)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (boardId) q = q.eq('board_id', boardId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getPost(id) {
  const { data: p, error } = await supabase.from('community_posts')
    .select('*, profiles:user_id(name, avatar_url), boards(slug, name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!p) return null;

  // 조회수 +1 (비차단)
  supabase.from('community_posts').update({ view_count: (p.view_count || 0) + 1 }).eq('id', id).then(() => {});

  const { data: media } = await supabase.from('post_media')
    .select('storage_path, media_type').eq('post_id', id).order('sort_order');

  return { ...p, media: media || [] };
}

export async function createPost({ board_id, title, body, content_thread_id = null }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  const { data, error } = await supabase.from('community_posts').insert({
    board_id, title, body,
    user_id: user.id,
    content_thread_id,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updatePost(id, patch) {
  const { data, error } = await supabase.from('community_posts').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePost(id) {
  // soft delete
  const { error } = await supabase.from('community_posts').update({ is_deleted: true }).eq('id', id);
  if (error) throw error;
}

// ===== 댓글 =====
export async function listComments(postId) {
  const { data, error } = await supabase.from('comments')
    .select('id, post_id, parent_comment_id, user_id, body, created_at, profiles:user_id(name, avatar_url)')
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });
  if (error) throw error;
  // 트리 구조
  const list = data || [];
  const byId = new Map(list.map((c) => [c.id, { ...c, replies: [] }]));
  const roots = [];
  byId.forEach((c) => {
    if (c.parent_comment_id && byId.has(c.parent_comment_id)) {
      byId.get(c.parent_comment_id).replies.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

export async function createComment({ post_id, body, parent_comment_id = null }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  const { data, error } = await supabase.from('comments').insert({
    post_id, body, parent_comment_id,
    user_id: user.id,
  }).select().single();
  if (error) throw error;
  // 게시글의 comment_count 업데이트
  await supabase.rpc('increment_post_comment_count', { p_post_id: post_id }).then(() => {}, async () => {
    // RPC 없을 때 fallback
    const { data: p } = await supabase.from('community_posts').select('comment_count').eq('id', post_id).maybeSingle();
    if (p) await supabase.from('community_posts').update({ comment_count: (p.comment_count || 0) + 1 }).eq('id', post_id);
  });
  return data;
}

export async function deleteComment(id, postId) {
  const { error } = await supabase.from('comments').update({ is_deleted: true }).eq('id', id);
  if (error) throw error;
  if (postId) {
    await supabase.rpc('decrement_post_comment_count', { p_post_id: postId }).then(() => {}, async () => {
      const { data: p } = await supabase.from('community_posts').select('comment_count').eq('id', postId).maybeSingle();
      if (p && p.comment_count > 0) {
        await supabase.from('community_posts').update({ comment_count: p.comment_count - 1 }).eq('id', postId);
      }
    });
  }
}

// ===== 반응 (좋아요·공감) =====
export async function toggleReaction({ target_type, target_id, reaction_type = 'like' }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');

  const { data: existing } = await supabase.from('reactions')
    .select('id').eq('target_type', target_type).eq('target_id', target_id)
    .eq('user_id', user.id).eq('reaction_type', reaction_type).maybeSingle();

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id);
    return { active: false };
  } else {
    await supabase.from('reactions').insert({ target_type, target_id, user_id: user.id, reaction_type });
    return { active: true };
  }
}

export async function getReactionState(target_type, target_id) {
  const { data: { user } } = await supabase.auth.getUser();
  const [{ count }, mine] = await Promise.all([
    supabase.from('reactions').select('id', { count: 'exact', head: true })
      .eq('target_type', target_type).eq('target_id', target_id),
    user ? supabase.from('reactions').select('id')
      .eq('target_type', target_type).eq('target_id', target_id)
      .eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return { count: count || 0, mine: !!mine.data };
}

// ===== 신고 =====
export async function reportTarget({ target_type, target_id, reason, detail = '' }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  const { error } = await supabase.from('reports').insert({
    target_type, target_id, reason, detail,
    reporter_id: user.id,
  });
  if (error) throw error;
}

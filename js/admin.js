// 어드민 헬퍼 — admin.html 에서만 사용
// 어드민 자격은 supabase RPC 내부에서 is_admin()으로 강제 (이메일 == sue.choi033@gmail.com)
import { supabase } from '../auth.js';

export const ADMIN_EMAIL = 'sue.choi033@gmail.com';

// ── 콘텐츠 승급 큐 ────────────────────────────
export async function fetchPromotionCandidates(limit = 50) {
  const { data, error } = await supabase.rpc('admin_promotion_candidates', { p_limit: limit });
  if (error) throw error;
  return data || [];
}

export async function promotePostToContent(postId, opts = {}) {
  const { data, error } = await supabase.rpc('admin_promote_post_to_content', {
    p_post_id: postId,
    p_category: opts.category || null,
    p_title:    opts.title || null,
    p_body:     opts.body || null,
  });
  if (error) throw error;
  return data; // new content id
}

// ── 게시글 / 댓글 강제 숨김 ───────────────────
export async function adminHidePost(postId) {
  const { error } = await supabase.rpc('admin_hide_post', { p_post_id: postId });
  if (error) throw error;
}

export async function adminUnhidePost(postId) {
  const { error } = await supabase.rpc('admin_unhide_post', { p_post_id: postId });
  if (error) throw error;
}

export async function adminHideComment(commentId) {
  const { error } = await supabase.rpc('admin_hide_comment', { p_comment_id: commentId });
  if (error) throw error;
}

export async function adminUnhideComment(commentId) {
  const { error } = await supabase.rpc('admin_unhide_comment', { p_comment_id: commentId });
  if (error) throw error;
}

// ── 신고함 ──────────────────────────────────
export async function fetchReports(status = null) {
  const { data, error } = await supabase.rpc('admin_list_reports', { p_status: status });
  if (error) throw error;
  return data || [];
}

export async function resolveReport(reportId, status) {
  const { error } = await supabase.rpc('admin_resolve_report', {
    p_report_id: reportId,
    p_status:    status,
  });
  if (error) throw error;
}

// ── 회원의 게시글 / 댓글 (어드민용 — 비공개 포함) ─
export async function fetchUserPostsWithDeleted(userId) {
  const { data, error } = await supabase
    .from('community_posts')
    .select('id, title, body, board_id, is_deleted, created_at, view_count, comment_count, reaction_count, boards(name, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchUserCommentsWithDeleted(userId) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, body, post_id, is_deleted, created_at, community_posts(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ── 카테고리 라벨 ────────────────────────────
export const CONTENT_CATEGORIES = {
  finance:    '재정',
  health:     '건강',
  family:     '가족',
  grief:      '사별',
  death_prep: '죽음 준비',
  memorial:   '추모',
  reflection: '성찰',
};

export const REPORT_STATUS_LABEL = {
  pending:    '신규',
  reviewing:  '검토 중',
  resolved:   '처리됨',
  dismissed:  '기각',
};

export const REPORT_TARGET_LABEL = {
  post:    '게시글',
  comment: '댓글',
  content: '콘텐츠',
  profile: '프로필',
};

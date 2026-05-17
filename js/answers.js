// 오늘의 성찰 질문 + 답변 헬퍼
import { supabase } from '../auth.js';

// 오늘의 질문 (서버 RPC 활용)
export async function getTodaysQuestion() {
  try {
    const { data, error } = await supabase.rpc('get_todays_question');
    if (error) throw error;
    return data?.[0] || null;
  } catch (_) {
    // RPC 미존재 시 fallback
    const { data } = await supabase
      .from('daily_questions')
      .select('id, question_text, category')
      .order('id', { ascending: true })
      .limit(1);
    return data?.[0] || null;
  }
}

// 본인이 오늘 질문에 답했는지
export async function hasAnsweredToday(questionId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !questionId) return null;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from('daily_answers')
    .select('id, content, visibility')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// 답변 미리보기 (커뮤니티 카드용)
export async function previewAnswers(questionId, limit = 3) {
  const { data, error } = await supabase
    .from('daily_answers')
    .select('id, content, created_at, user_id, visibility, profiles:user_id(name)')
    .eq('question_id', questionId)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// 답변 → 일기로 저장 (S5-2)
// 답변 작성 직후 또는 이미 작성된 답변을 일기로 변환할 때 호출
export async function saveAnswerAsDiary({ questionText, answerContent, entryDate = null, templateType = 'gratitude' }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');

  const today = entryDate || new Date().toISOString().slice(0, 10);

  const { data: entry, error } = await supabase.from('diary_entries').insert({
    user_id: user.id,
    entry_date: today,
    template_type: templateType,
    title: questionText ? `Q. ${questionText.slice(0, 80)}` : '오늘의 한 문장',
    content: answerContent,
    visibility: 'private',
  }).select().single();
  if (error) throw error;
  return entry;
}

// 내 답변 목록 (마이 탭 활동 조회용)
export async function listMyAnswers({ limit = 20, offset = 0 } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('daily_answers')
    .select('id, content, visibility, created_at, question_id, daily_questions(question_text, category)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
}

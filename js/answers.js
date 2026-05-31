// 오늘의 성찰 질문 + 답변 헬퍼
import { supabase } from '../auth.js';

// 오늘의 질문 + 시드 답변 (entice peek용). RPC 결과에 seed_answers가 없으면 별도 조회.
export async function getTodaysQuestion() {
  try {
    const { data, error } = await supabase.rpc('get_todays_question');
    if (error) throw error;
    const q = data?.[0] || null;
    if (q && (!('seed_answers' in q) || !('answer_kind' in q))) {
      const { data: extra } = await supabase
        .from('daily_questions')
        .select('seed_answers, answer_kind')
        .eq('id', q.id)
        .maybeSingle();
      q.seed_answers = extra?.seed_answers || { answers: [] };
      q.answer_kind  = extra?.answer_kind  || 'text';
    }
    return q;
  } catch (_) {
    const { data } = await supabase
      .from('daily_questions')
      .select('id, question_text, category, seed_answers, answer_kind')
      .order('id', { ascending: true })
      .limit(1);
    return data?.[0] || null;
  }
}

// 답변 미리보기 (앤티스 peek 포함). userHasAnswered = true 면 풀 reveal.
//   answers: 실제 사용자 답 (visibility=public)
//   seed:    daily_questions.seed_answers 페르소나 답
// 반환: { answers, total, locked } — locked=true 면 첫 1개만 보이게 frontend 처리.
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

// 본인이 오늘 질문에 답했는지
export async function hasAnsweredToday(questionId) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
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

// 답변 → 일기로 저장 (S5-2)
// 답변 작성 직후 또는 이미 작성된 답변을 일기로 변환할 때 호출
export async function saveAnswerAsDiary({
  questionText,
  answerContent,
  entryDate = null,
  templateType = 'gratitude',
  visibility = 'private',  // 'private' | 'friends' | 'public'
}) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) throw new Error('로그인 필요');

  const today = entryDate || new Date().toISOString().slice(0, 10);
  const safeVis = ['private', 'friends', 'public'].includes(visibility) ? visibility : 'private';

  const { data: entry, error } = await supabase.from('diary_entries').insert({
    user_id: user.id,
    entry_date: today,
    template_type: templateType,
    title: questionText ? `Q. ${questionText.slice(0, 80)}` : '오늘의 한 문장',
    content: answerContent,
    visibility: safeVis,
  }).select().single();
  if (error) throw error;
  return entry;
}

// 내 답변 목록 (마이 탭 활동 조회용)
export async function listMyAnswers({ limit = 20, offset = 0 } = {}) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
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

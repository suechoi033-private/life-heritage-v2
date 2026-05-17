// 돌봄 헬퍼 — 대상자·기록·대시보드 집계·응급 연락처·실시간 구독
import { supabase } from '../auth.js';

// ===== 대상자 =====
export async function listMyCareSubjects() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // care_members로 접근 가능한 대상 조회 (owner + invited)
  const { data, error } = await supabase
    .from('care_members')
    .select('subject_id, role, care_subjects(id, name, relation, created_at)')
    .eq('user_id', user.id);
  if (error) throw error;
  return (data || []).map((m) => ({
    ...m.care_subjects,
    role: m.role,
  })).filter((s) => s.id);
}

// ===== 대시보드 집계 =====
export async function getCareDashboard(subjectId, days = 28) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: logs, error } = await supabase
    .from('care_logs')
    .select('id, body, mood, created_at')
    .eq('subject_id', subjectId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });
  if (error) throw error;

  const totalLogs = logs?.length || 0;
  const daysWithLogs = new Set((logs || []).map((l) => l.created_at.slice(0, 10))).size;
  const moodCounts = {};
  (logs || []).forEach((l) => {
    if (l.mood) moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
  });

  // 주별 그룹
  const weekly = {};
  (logs || []).forEach((l) => {
    const d = new Date(l.created_at);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const key = monday.toISOString().slice(0, 10);
    if (!weekly[key]) weekly[key] = { week: key, count: 0, moods: {} };
    weekly[key].count++;
    if (l.mood) weekly[key].moods[l.mood] = (weekly[key].moods[l.mood] || 0) + 1;
  });

  return {
    period_days: days,
    totalLogs,
    daysWithLogs,
    completionPct: Math.round((daysWithLogs / days) * 100),
    moodCounts,
    weekly: Object.values(weekly).sort((a, b) => a.week.localeCompare(b.week)),
    recentLogs: (logs || []).slice(-5).reverse(),
  };
}

// ===== 응급 연락처 =====
export async function listEmergencyContacts(subjectId) {
  const { data, error } = await supabase
    .from('care_emergency_contacts')
    .select('*')
    .eq('subject_id', subjectId)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function createEmergencyContact(subjectId, { name, phone, relation }) {
  const { data: last } = await supabase.from('care_emergency_contacts')
    .select('sort_order').eq('subject_id', subjectId).order('sort_order', { ascending: false }).limit(1);
  const next = (last?.[0]?.sort_order ?? -1) + 1;
  const { data, error } = await supabase.from('care_emergency_contacts').insert({
    subject_id: subjectId, name, phone, relation,
    sort_order: next,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEmergencyContact(id) {
  const { error } = await supabase.from('care_emergency_contacts').delete().eq('id', id);
  if (error) throw error;
}

// 응급 상황 공유 — care_logs에 [SOS] 마커로 기록
export async function broadcastEmergency(subjectId, { note = '', contactsCalled = [] } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  const body = `[SOS] ${note || '응급 상황 공유'}`
    + (contactsCalled.length ? `\n연락: ${contactsCalled.join(', ')}` : '');
  const { data, error } = await supabase.from('care_logs').insert({
    subject_id: subjectId,
    user_id: user.id,
    body,
    mood: 'urgent',
  }).select().single();
  if (error) throw error;
  return data;
}

// ===== 실시간 구독 =====
// care_logs 변경을 구독해서 콜백 호출
export function subscribeCareLogs(subjectId, onChange) {
  const channel = supabase
    .channel(`care_logs:${subjectId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'care_logs',
      filter: `subject_id=eq.${subjectId}`,
    }, (payload) => onChange(payload))
    .subscribe();
  return () => supabase.removeChannel(channel);
}

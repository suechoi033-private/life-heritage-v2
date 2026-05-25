// 케어링 헬퍼 — 대상자·기록·대시보드 집계·응급 연락처·실시간 구독
import { supabase } from '../auth.js';

// ===== 대상자 =====
// 본인이 직접 만든 care_subjects(owner) + care_members로 초대받은 대상자 모두 조회
// 기존 care.html은 owner를 care_subjects.user_id에 저장하므로 두 경로 모두 확인
export async function listMyCareSubjects() {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return [];

  const [{ data: owned, error: e1 }, { data: invited, error: e2 }] = await Promise.all([
    supabase.from('care_subjects')
      .select('id, name, relation, created_at')
      .eq('user_id', user.id),
    supabase.from('care_members')
      .select('subject_id, role, care_subjects(id, name, relation, created_at)')
      .eq('user_id', user.id),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  // 중복 제거 (owner이면서 member에도 있을 수 있음)
  const map = new Map();
  (owned || []).forEach((s) => {
    if (s.id) map.set(s.id, { ...s, role: 'owner' });
  });
  (invited || []).forEach((m) => {
    if (!m.care_subjects?.id) return;
    if (!map.has(m.subject_id)) {
      map.set(m.subject_id, { ...m.care_subjects, role: m.role });
    }
  });
  return Array.from(map.values()).sort((a, b) =>
    (b.created_at || '').localeCompare(a.created_at || '')
  );
}

// ===== 대시보드 집계 =====
// care_logs 실제 컬럼: id, subject_id, author_id, log_date, log_time,
//                      daily_status, medications, mood(v3 신규), created_at
export async function getCareDashboard(subjectId, days = 28) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: logs, error } = await supabase
    .from('care_logs')
    .select('id, mood, log_date, daily_status, medications, created_at')
    .eq('subject_id', subjectId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });
  if (error) throw error;

  const totalLogs = logs?.length || 0;
  // log_date 우선, 없으면 created_at의 날짜 부분 사용
  const dayKeys = new Set((logs || []).map((l) => l.log_date || (l.created_at || '').slice(0, 10)));
  const daysWithLogs = dayKeys.size;

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

  // 일별 집계 (GitHub 컨트리뷰션 그래프용) — YYYY-MM-DD → count
  const daily = {};
  (logs || []).forEach((l) => {
    const key = l.log_date || (l.created_at || '').slice(0, 10);
    if (!key) return;
    daily[key] = (daily[key] || 0) + 1;
  });

  return {
    period_days: days,
    totalLogs,
    daysWithLogs,
    completionPct: Math.round((daysWithLogs / days) * 100),
    moodCounts,
    weekly: Object.values(weekly).sort((a, b) => a.week.localeCompare(b.week)),
    daily,
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
// 기존 스키마: author_id, daily_status 사용
export async function broadcastEmergency(subjectId, { note = '', contactsCalled = [] } = {}) {
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) throw new Error('로그인 필요');
  const body = `[SOS] ${note || '응급 상황 공유'}`
    + (contactsCalled.length ? `\n연락: ${contactsCalled.join(', ')}` : '');
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from('care_logs').insert({
    subject_id: subjectId,
    author_id: user.id,
    log_date: today,
    daily_status: body,
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

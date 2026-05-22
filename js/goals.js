// 목표·계획 CRUD 헬퍼
import { supabase } from '../auth.js';

export const AREAS = {
  finance: { label: '재정',     icon: '💰', color: '#D4A645', bg: '#FBF5E6' },
  health:  { label: '건강',     icon: '🌿', color: '#1F6E4E', bg: '#E7F1EC' },
  family:  { label: '가족',     icon: '🏡', color: '#4A7FA8', bg: '#E3EEF7' },
  growth:  { label: '개인 성장', icon: '🌱', color: '#9A6BB8', bg: '#F0E7F6' },
};

export const PERIODS = [
  { months: 3,  label: '3개월'  },
  { months: 6,  label: '6개월'  },
  { months: 12, label: '12개월' },
  { months: 60, label: '5년'    },
];

export const PLAN_TYPES = {
  weekly_checklist: { label: '주간 체크리스트', icon: '📅' },
  monthly_review:   { label: '월간 점검표',     icon: '📊' },
  milestone:        { label: '마일스톤',         icon: '🚩' },
  custom:           { label: '자유 항목',         icon: '✏️' },
};

export const PRIORITY_LABELS = {
  1: '최상', 2: '상', 3: '보통', 4: '하', 5: '최하',
};

// 기본 종료일 계산
export function defaultDueDate(periodMonths, startDate = new Date()) {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + periodMonths);
  return d.toISOString().slice(0, 10);
}

// ===== 목표 CRUD =====
export async function listMyGoals({ status = 'active', area = null } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  let q = supabase.from('goals')
    .select('id, area, title, description, period_months, start_date, due_date, priority, status, progress_pct, created_at')
    .eq('user_id', user.id)
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false });
  if (status) q = q.eq('status', status);
  if (area)   q = q.eq('area', area);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getGoal(id) {
  const { data: goal, error } = await supabase.from('goals').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!goal) return null;
  const [{ data: plans }, { data: links }] = await Promise.all([
    supabase.from('goal_plans').select('*').eq('goal_id', id).order('sort_order'),
    supabase.from('diary_goal_links').select('diary_id, diary_entries(id, entry_date, title)').eq('goal_id', id),
  ]);
  return {
    ...goal,
    plans: plans || [],
    linked_diaries: (links || []).map((l) => l.diary_entries).filter(Boolean),
  };
}

export async function createGoal({ area, title, description, period_months, start_date, due_date, priority }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  const start = start_date || new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from('goals').insert({
    user_id: user.id,
    area, title,
    description: description || null,
    period_months,
    start_date: start,
    due_date: due_date || defaultDueDate(period_months, new Date(start)),
    priority: priority || 3,
    status: 'active',
    progress_pct: 0,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateGoal(id, patch) {
  const { data, error } = await supabase.from('goals').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGoal(id) {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

// ===== 세부 계획 (goal_plans) =====
export async function createPlan(goalId, { title, plan_type, due_date }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  // sort_order = 마지막 + 1
  const { data: last } = await supabase.from('goal_plans')
    .select('sort_order').eq('goal_id', goalId).order('sort_order', { ascending: false }).limit(1);
  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;
  const { data, error } = await supabase.from('goal_plans').insert({
    goal_id: goalId,
    title,
    plan_type: plan_type || 'custom',
    due_date: due_date || null,
    status: 'todo',
    sort_order: nextOrder,
  }).select().single();
  if (error) throw error;
  await recalcGoalProgress(goalId);
  return data;
}

export async function updatePlanStatus(planId, status) {
  const { data, error } = await supabase.from('goal_plans')
    .update({ status })
    .eq('id', planId)
    .select('id, goal_id, status')
    .single();
  if (error) throw error;
  await supabase.from('goal_progress_logs').insert({
    goal_id: data.goal_id,
    plan_id: planId,
    note: `세부계획 상태 변경: ${status}`,
  });
  await recalcGoalProgress(data.goal_id);
  return data;
}

export async function deletePlan(planId) {
  const { data: row } = await supabase.from('goal_plans').select('goal_id').eq('id', planId).maybeSingle();
  const { error } = await supabase.from('goal_plans').delete().eq('id', planId);
  if (error) throw error;
  if (row?.goal_id) await recalcGoalProgress(row.goal_id);
}

// 세부계획 done 비율로 목표 진척도 자동 갱신
export async function recalcGoalProgress(goalId) {
  const { data: plans } = await supabase.from('goal_plans')
    .select('status').eq('goal_id', goalId);
  if (!plans?.length) {
    await supabase.from('goals').update({ progress_pct: 0 }).eq('id', goalId);
    return 0;
  }
  const done = plans.filter((p) => p.status === 'done').length;
  const pct = Math.round((done / plans.length) * 100);
  const patch = { progress_pct: pct };
  if (pct === 100) {
    patch.status = 'completed';
    patch.completed_at = new Date().toISOString();
  }
  await supabase.from('goals').update(patch).eq('id', goalId);
  return pct;
}

// ===== 대시보드 집계 =====
export async function getDashboardSummary() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: goals, error } = await supabase.from('goals')
    .select('area, status, progress_pct, due_date')
    .eq('user_id', user.id);
  if (error) throw error;

  const byArea = {};
  Object.keys(AREAS).forEach((a) => { byArea[a] = { total: 0, active: 0, completed: 0, sumProgress: 0 }; });

  let totalActive = 0;
  let totalProgress = 0;

  (goals || []).forEach((g) => {
    if (!byArea[g.area]) return;
    byArea[g.area].total++;
    if (g.status === 'active') {
      byArea[g.area].active++;
      byArea[g.area].sumProgress += g.progress_pct || 0;
      totalActive++;
      totalProgress += g.progress_pct || 0;
    }
    if (g.status === 'completed') byArea[g.area].completed++;
  });

  Object.values(byArea).forEach((v) => {
    v.avgProgress = v.active > 0 ? Math.round(v.sumProgress / v.active) : 0;
  });

  // 다가오는 마감 (활성 + 30일 이내)
  const now = new Date();
  const limit = new Date(); limit.setDate(now.getDate() + 30);
  const upcoming = (goals || [])
    .filter((g) => g.status === 'active' && g.due_date && new Date(g.due_date) >= now && new Date(g.due_date) <= limit)
    .length;

  return {
    totalActive,
    overallProgress: totalActive > 0 ? Math.round(totalProgress / totalActive) : 0,
    byArea,
    upcomingDeadlines: upcoming,
  };
}

// ===== 일기 ↔ 목표 연결 =====
export async function linkDiaryToGoal(diaryId, goalId) {
  const { error } = await supabase.from('diary_goal_links').upsert({ diary_id: diaryId, goal_id: goalId });
  if (error) throw error;
}

export async function unlinkDiaryFromGoal(diaryId, goalId) {
  const { error } = await supabase.from('diary_goal_links').delete()
    .eq('diary_id', diaryId).eq('goal_id', goalId);
  if (error) throw error;
}

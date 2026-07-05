// 묻다 — 공유 앱 모듈: Supabase 클라이언트, 인증, 하트비트(안부확인), 이어온 날들
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://zugwccngzprjjnwtajyr.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_OhOQp9Q-v6bGM9TnVPKG1g_4PFUT6dN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});

// gh-pages(/life-heritage-v2/mutda/)와 로컬 서버 양쪽에서 동작하도록 경로 계산
export const BASE = new URL('..', import.meta.url).href; // .../mutda/
export const url = (page) => new URL(page, BASE).href;

// ---------- 인증 ----------
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    const next = encodeURIComponent(location.pathname.split('/').pop() || 'home.html');
    location.replace(url(`login.html?next=${next}`));
    throw new Error('redirecting to login');
  }
  return user;
}

export async function redirectIfAuthed(to = 'home.html') {
  const user = await getUser();
  if (user) location.replace(url(to));
}

export async function signUp(email, password, name) {
  return supabase.auth.signUp({
    email, password,
    options: {
      data: { name },
      emailRedirectTo: url('welcome.html'),
    },
  });
}

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

export async function signOut() {
  await supabase.auth.signOut();
  location.href = url('index.html');
}

export function friendlyError(error) {
  const m = error?.message || '';
  if (m.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (m.includes('already registered')) return '이미 가입된 이메일입니다. 로그인해 주세요.';
  if (m.includes('at least 6 characters')) return '비밀번호는 6자 이상이어야 합니다.';
  if (m.includes('valid email')) return '올바른 이메일 주소를 입력해 주세요.';
  if (m.includes('Email not confirmed')) return '이메일 인증이 아직 완료되지 않았어요. 받은 편지함을 확인해 주세요.';
  if (m.includes('rate limit')) return '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.';
  return '문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

// ---------- 프로필 ----------
export async function getProfile(userId) {
  const { data } = await supabase.from('mutda_profiles')
    .select('*').eq('user_id', userId).maybeSingle();
  return data;
}

// ---------- 하트비트 (고독사 방지의 심장) ----------
// 앱을 열 때마다 last_active_at 갱신 + 미해결 안부 알림 자동 해제.
// 위치 공유를 켠 사용자는 GPS 좌표도 함께 기록 (권한 있을 때만).
const HB_KEY = 'mutda:last_heartbeat';

export async function heartbeat(profile) {
  const last = Number(localStorage.getItem(HB_KEY) || 0);
  if (Date.now() - last < 5 * 60 * 1000) return; // 5분 스로틀
  localStorage.setItem(HB_KEY, String(Date.now()));

  let lat = null, lng = null;
  if (profile?.share_location && 'geolocation' in navigator) {
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000, maximumAge: 600000 }));
      lat = pos.coords.latitude; lng = pos.coords.longitude;
    } catch { /* 권한 거부/실패 시 접속 기록만 남긴다 */ }
  }
  await supabase.rpc('mutda_heartbeat', { p_lat: lat, p_lng: lng });
}

// ---------- 이어온 날들 (조용한 스트릭 — 남과 비교하지 않는다) ----------
export async function touchStreak(profile) {
  if (!profile) return profile;
  const today = new Date().toISOString().slice(0, 10);
  if (profile.last_visit_date === today) return profile;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = profile.last_visit_date === yesterday ? (profile.streak_days || 0) + 1 : 1;

  const { data } = await supabase.from('mutda_profiles')
    .update({ streak_days: streak, last_visit_date: today })
    .eq('user_id', profile.user_id).select().single();
  return data || { ...profile, streak_days: streak, last_visit_date: today };
}

// 로그인된 페이지 공통 초기화: 프로필 로드 + 하트비트 + 스트릭
export async function initAppPage() {
  const user = await requireAuth();
  let profile = await getProfile(user.id);
  if (!profile) { location.replace(url('onboarding.html')); throw new Error('needs onboarding'); }
  profile = await touchStreak(profile);
  heartbeat(profile); // 대기하지 않음
  return { user, profile };
}

// ---------- 이벤트 로그 ----------
export async function logEvent(event, meta = {}) {
  try {
    const user = await getUser();
    await supabase.from('mutda_events').insert({
      user_id: user?.id ?? null, event,
      meta: { ...meta, page: location.pathname.split('/').pop() },
    });
  } catch { /* 로그 실패는 무시 */ }
}

// ---------- 토스트 ----------
let toastTimer;
export function toast(msg) {
  let el = document.getElementById('mutda-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'mutda-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

export const esc = (s) => String(s ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
};

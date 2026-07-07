// Life Heritage · 잇다
// Shared Supabase client + auth helpers
// Loaded from: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://zugwccngzprjjnwtajyr.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_OhOQp9Q-v6bGM9TnVPKG1g_4PFUT6dN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// 카카오 JavaScript 키(공개키). 참고용 보관.
// ※ 현재 카카오 로그인은 Supabase 네이티브 OAuth(대시보드의 REST 키로 설정)를 쓰므로
//   이 JS 키는 코드에서 사용하지 않는다. (향후 JS SDK 직접 연동 시 대비해 남겨둠)
if (typeof window !== 'undefined') {
  window.__KAKAO_JS_KEY__ = '37a03a521d798c59721467e0528ea375';
}

// =========================================================
// Auth helpers
// =========================================================

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${window.location.origin}/life-heritage-v2/welcome.html`,
    },
  });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// ── 기기에 기억하는 로그인 계정 목록 (이메일·표시이름만; 비밀번호는 저장하지 않음) ──
const KNOWN_ACCOUNTS_KEY = 'itda:known_accounts';

export function getKnownAccounts() {
  try {
    const raw = localStorage.getItem(KNOWN_ACCOUNTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((a) => a && a.email) : [];
  } catch (_) {
    return [];
  }
}

export function rememberAccount(email, name) {
  if (!email) return;
  const e = String(email).trim().toLowerCase();
  const list = getKnownAccounts().filter((a) => a.email !== e);
  list.unshift({ email: e, name: name || e.split('@')[0], ts: Date.now() });
  try {
    localStorage.setItem(KNOWN_ACCOUNTS_KEY, JSON.stringify(list.slice(0, 5)));
  } catch (_) { /* 저장 실패는 무시 */ }
}

export function forgetAccount(email) {
  if (!email) return;
  const e = String(email).trim().toLowerCase();
  try {
    localStorage.setItem(KNOWN_ACCOUNTS_KEY, JSON.stringify(getKnownAccounts().filter((a) => a.email !== e)));
  } catch (_) { /* 무시 */ }
}

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/life-heritage-v2/reset.html`,
  });
  return { data, error };
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
}

// Redirect guard: use on protected pages
export async function requireAuth(redirectTo = 'login.html') {
  const session = await getCurrentSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

// Redirect if already logged in (use on signup/login pages)
export async function redirectIfAuthed(redirectTo = './index.html') {
  const session = await getCurrentSession();
  if (session) {
    window.location.href = redirectTo;
  }
}

// =========================================================
// 페이지뷰 로깅 (리텐션 테스트 계측)
// 로그인 사용자가 페이지에 진입할 때마다 app_events에 1건 기록.
// 측정 실패는 앱 동작을 절대 방해하지 않도록 조용히 무시한다.
// =========================================================
export async function logEvent(eventType, meta = {}, pathOverride) {
  try {
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;
    if (!user) return; // 로그인 사용자만 기록 (익명 방문은 RLS상 기록 안 됨)
    const path = pathOverride || (window.location.pathname.split('/').pop() || 'index.html');
    await supabase.from('app_events').insert({
      user_id: user.id,
      event_type: eventType,
      path,
      meta,
    });
  } catch (_) { /* 계측 실패는 무시 */ }
}

export async function logPageView(extra = {}) {
  return logEvent('pageview', { ref: document.referrer || null, ...extra });
}

// 모듈 로드(=페이지 진입) 시 자동 1회 기록.
if (typeof window !== 'undefined') {
  logPageView();
  // 공용 웹 트래커(js/track.js) 주입 — 익명 방문·유입경로(referrer/UTM)를 web_events에 기록.
  // auth.js를 로드하는 모든 잇다 페이지에 자동 적용된다. (묻다·개인홈은 태그로 직접 임베드)
  try {
    if (!window.__itdaTracked && !document.querySelector('script[data-site]')) {
      const s = document.createElement('script');
      s.src = new URL('js/track.js', import.meta.url).href;
      s.dataset.site = 'itda';
      s.defer = true;
      document.head.appendChild(s);
    }
  } catch (_) { /* 계측 실패는 무시 */ }
}

// =========================================================
// Korean-friendly error messages
// =========================================================
export function friendlyError(error) {
  if (!error) return '';
  const msg = (error.message || '').toLowerCase();
  if (msg.includes('invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않습니다.';
  if (msg.includes('user already registered')) return '이미 가입된 이메일입니다.';
  if (msg.includes('email not confirmed')) return '이메일 인증이 필요합니다. 받은 편지함을 확인해주세요.';
  if (msg.includes('password should be at least')) return '비밀번호는 최소 6자 이상이어야 합니다.';
  if (msg.includes('unable to validate email')) return '이메일 형식이 올바르지 않습니다.';
  if (msg.includes('rate limit')) return '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
  return error.message || '문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

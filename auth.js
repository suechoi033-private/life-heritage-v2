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
      emailRedirectTo: `${window.location.origin}/welcome.html`,
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

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset.html`,
  });
  return { data, error };
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
}

// Redirect guard: use on protected pages
export async function requireAuth(redirectTo = '/login.html') {
  const session = await getCurrentSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

// Redirect if already logged in (use on signup/login pages)
export async function redirectIfAuthed(redirectTo = '/my.html') {
  const session = await getCurrentSession();
  if (session) {
    window.location.href = redirectTo;
  }
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

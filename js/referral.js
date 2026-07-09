// 유입 경로 트래킹 — ?ref= 파라미터를 localStorage에 캡처 → 가입 완료 시 profiles로 이관.
// 사용:
//   진입 페이지(index.html, beta.html, signup.html, login.html 등):
//     import { captureReferral } from './js/referral.js'; captureReferral();
//   가입 완료 훅(welcome.html):
//     import { hoistReferral } from './js/referral.js'; await hoistReferral(supabase, user.id);

const STORE_KEY = 'itda:referral_source';

/** 진입 URL의 ?ref= 값을 localStorage에 저장. first-touch 보존(이미 있으면 덮지 않음). */
export function captureReferral() {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref) return null;
    // 안전 필터: 알파벳·숫자·언더스코어·하이픈만, 최대 40자.
    const clean = ref.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 40);
    if (!clean) return null;
    if (localStorage.getItem(STORE_KEY)) return null; // first-touch 보존
    localStorage.setItem(STORE_KEY, clean);
    return clean;
  } catch (_) { return null; }
}

/** localStorage에 저장된 referral 값을 profiles.referral_source 로 이관하고 로컬은 정리.
 *  이미 profiles에 값이 있으면 덮지 않음(is null 조건). */
export async function hoistReferral(supabase, userId) {
  if (!userId) return;
  let ref = null;
  try { ref = localStorage.getItem(STORE_KEY); } catch (_) { return; }
  if (!ref) return;
  try {
    await supabase.from('profiles')
      .update({ referral_source: ref })
      .eq('id', userId)
      .is('referral_source', null);
    localStorage.removeItem(STORE_KEY);
  } catch (_) { /* 실패해도 로컬 값은 남겨 다음 로그인 때 재시도 */ }
}

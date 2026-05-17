// 운영자가 설정한 값을 모든 페이지에서 통일적으로 가져오는 헬퍼
// 우선순위: window 변수 > localStorage > 빈 값
//
// setup.html에서 입력하면 localStorage에 저장되고,
// 모든 페이지의 PWA/소셜로그인 코드가 자동으로 픽업합니다.

const STORE_KEY = 'itda:app-config';

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

export function getAppConfig() {
  return load();
}

export function setAppConfig(patch) {
  const cur = load();
  const next = { ...cur, ...patch };
  localStorage.setItem(STORE_KEY, JSON.stringify(next));
  return next;
}

export function getVapidPublicKey() {
  if (typeof window !== 'undefined' && window.__VAPID_PUBLIC_KEY__) return window.__VAPID_PUBLIC_KEY__;
  return load().vapidPublicKey || '';
}

export function getKakaoJsKey() {
  if (typeof window !== 'undefined' && window.__KAKAO_JS_KEY__) return window.__KAKAO_JS_KEY__;
  return load().kakaoJsKey || '';
}

// 페이지 진입 시 자동으로 window 변수에 주입 (기존 코드 호환)
export function applyAppConfig() {
  if (typeof window === 'undefined') return;
  const cfg = load();
  if (cfg.vapidPublicKey && !window.__VAPID_PUBLIC_KEY__) window.__VAPID_PUBLIC_KEY__ = cfg.vapidPublicKey;
  if (cfg.kakaoJsKey     && !window.__KAKAO_JS_KEY__)     window.__KAKAO_JS_KEY__     = cfg.kakaoJsKey;
}

// 즉시 적용 (모듈 import 시점에)
applyAppConfig();

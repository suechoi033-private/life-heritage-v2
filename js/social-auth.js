// 잇다 — 소셜 로그인 헬퍼 (카카오 + 구글 + 애플)
// 카카오는 Supabase 미지원이라 Edge Function 브리지 필요
//   Supabase Edge Function: /functions/v1/kakao-signin
//   요청: { access_token } → 응답: { session: {access_token, refresh_token} }

import { supabase } from '../auth.js';

// 키는 호출 시점에 읽는다(window.__KAKAO_JS_KEY__는 auth.js에서 전역 주입).
// 모듈 로드 순서와 무관하게 동작하도록 const 캐싱을 쓰지 않는다.
function kakaoKey() {
  return (typeof window !== 'undefined' && window.__KAKAO_JS_KEY__) || '';
}

let kakaoLoaded = false;

async function loadKakaoSDK() {
  if (kakaoLoaded) return;
  const KAKAO_JS_KEY = kakaoKey();
  if (!KAKAO_JS_KEY) {
    throw new Error('카카오 로그인이 아직 설정되지 않았어요. 이메일로 가입해주세요.');
  }
  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-kakao-sdk]');
    if (existing) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    s.integrity = 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4';
    s.crossOrigin = 'anonymous';
    s.dataset.kakaoSdk = 'true';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_JS_KEY);
  kakaoLoaded = true;
}

// ========================================
// 카카오 로그인
// ========================================
export async function signInWithKakao(opts = {}) {
  await loadKakaoSDK();

  const { redirectAfter = './index.html', inviteCode } = opts;

  return new Promise((resolve, reject) => {
    window.Kakao.Auth.login({
      success: async (authObj) => {
        try {
          // Edge Function에 access_token 전달 → Supabase 세션 발급
          const resp = await fetch(
            `${supabase.supabaseUrl}/functions/v1/kakao-signin`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: authObj.access_token }),
            }
          );
          if (!resp.ok) throw new Error('Kakao 세션 발급 실패');
          const { access_token, refresh_token } = await resp.json();

          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;

          if (inviteCode) localStorage.setItem('itda:pending_invite', inviteCode);
          window.location.href = redirectAfter;
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      fail: reject,
    });
  });
}

// ========================================
// 구글 로그인 (Supabase 네이티브)
// ========================================
export async function signInWithGoogle(opts = {}) {
  const { redirectAfter = './index.html' } = opts;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${location.origin}${location.pathname.replace(/[^/]+$/, '')}${redirectAfter.replace('./', '')}`,
    },
  });
  if (error) throw error;
}

// ========================================
// 애플 로그인 (Supabase 네이티브)
// ========================================
export async function signInWithApple(opts = {}) {
  const { redirectAfter = './index.html' } = opts;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${location.origin}${location.pathname.replace(/[^/]+$/, '')}${redirectAfter.replace('./', '')}`,
    },
  });
  if (error) throw error;
}

// ========================================
// 소셜 로그인 버튼 렌더링 (공용)
// ========================================
export function renderSocialAuthButtons(container, opts = {}) {
  const { redirectAfter = './index.html', inviteCode = '' } = opts;
  container.innerHTML = `
    <div class="social-auth-wrap">
      <div class="social-auth-divider"><span>또는</span></div>
      <button type="button" class="social-btn social-btn-kakao" data-provider="kakao">
        <span class="social-btn-icon">💬</span>
        <span>카카오로 계속하기</span>
      </button>
      <button type="button" class="social-btn social-btn-google" data-provider="google">
        <span class="social-btn-icon">G</span>
        <span>Google로 계속하기</span>
      </button>
    </div>
  `;

  container.querySelectorAll('.social-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const provider = btn.dataset.provider;
      btn.disabled = true;
      const originalText = btn.querySelector('span:last-child').textContent;
      btn.querySelector('span:last-child').textContent = '연결 중...';
      try {
        if (provider === 'kakao')  await signInWithKakao({ redirectAfter, inviteCode });
        if (provider === 'google') await signInWithGoogle({ redirectAfter });
        if (provider === 'apple')  await signInWithApple({ redirectAfter });
      } catch (err) {
        alert(`로그인 실패: ${err.message || err}`);
        btn.disabled = false;
        btn.querySelector('span:last-child').textContent = originalText;
      }
    });
  });
}
